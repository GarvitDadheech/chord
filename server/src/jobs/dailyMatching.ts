import cron from 'node-cron';
import { supabase } from '../config/supabase';
import { embeddingService } from '../services/embeddingService';
import logger from '../config/logger';

/**
 * Daily matching algorithm
 * Runs every day at 12:00 AM IST
 */
export function startDailyMatchingJob() {
  // Schedule: 0 0 * * * (midnight every day)
  // IST is UTC+5:30, so 12:00 AM IST = 6:30 PM UTC previous day
  cron.schedule('30 18 * * *', async () => {
    logger.info('Running daily matching algorithm...');
    await runDailyMatching();
  }, {
    timezone: 'UTC'
  });

  logger.info('Daily matching job scheduled (runs at 12:00 AM IST)');
}

async function runDailyMatching() {
  try {
    // Get all active users with music embeddings and locations
    const { data: activeUsers, error: usersError } = await supabase
      .from('users')
      .select('id, music_embedding, location')
      .eq('is_active', true)
      .not('music_embedding', 'is', null)
      .not('location', 'is', null);

    if (usersError) {
      logger.error('Error fetching users:', { error: usersError });
      return;
    }

    if (!activeUsers || activeUsers.length === 0) {
      logger.info('No active users found');
      return;
    }

    logger.info(`Processing ${activeUsers.length} users for matching...`);

    let matchesCreated = 0;

    for (const user of activeUsers) {
      try {
        // Check if user already has a match today
        const today = new Date().toISOString().split('T')[0];
        const { data: existingMatch } = await supabase
          .from('matches')
          .select('id')
          .or(`user1_id.eq.${user.id},user2_id.eq.${user.id}`)
          .eq('created_at', today)
          .single();

        if (existingMatch) {
          logger.debug(`User ${user.id} already has a match today`);
          continue;
        }

        // Find best match candidate
        const match = await findBestMatch(user);

        if (match) {
          // Create match record
          const { error: matchError } = await supabase
            .from('matches')
            .insert({
              user1_id: user.id,
              user2_id: match.userId,
              match_score: match.matchScore,
              music_similarity: match.musicSimilarity,
              distance_km: match.distanceKm,
            });

          if (matchError) {
            logger.error(`Error creating match for user ${user.id}:`, { error: matchError, userId: user.id });
          } else {
            matchesCreated++;
            logger.info(`Created match between ${user.id} and ${match.userId}`, {
              user1Id: user.id,
              user2Id: match.userId,
              matchScore: match.matchScore,
            });
          }
        }
      } catch (error: any) {
        logger.error(`Error processing user ${user.id}:`, { error: error.message, userId: user.id });
      }
    }

    logger.info(`Daily matching complete. Created ${matchesCreated} matches.`, {
      matchesCreated,
      totalUsers: activeUsers.length,
    });
  } catch (error: any) {
    logger.error('Daily matching error:', { error: error.message, stack: error.stack });
  }
}

async function findBestMatch(user: any) {
  try {
    // Use the database function to find candidates
    const embeddingArray = JSON.parse(user.music_embedding);

    const { data: candidates, error } = await supabase.rpc('find_match_candidates', {
      p_user_id: user.id,
      p_user_embedding: `[${embeddingArray.join(',')}]`,
      p_user_location: user.location,
      p_max_distance_km: 50,
    });

    if (error || !candidates || candidates.length === 0) {
      return null;
    }

    // Calculate match scores for all candidates
    interface ScoredCandidate {
      userId: string;
      musicSimilarity: number;
      distanceKm: number;
      activityScore: number;
      matchScore: number;
    }

    const scoredCandidates: ScoredCandidate[] = candidates.map((candidate: any) => {
      const matchScore = embeddingService.calculateMatchScore(
        candidate.music_similarity,
        candidate.distance_km,
        candidate.activity_score,
        50
      );

      return {
        userId: candidate.id,
        musicSimilarity: candidate.music_similarity,
        distanceKm: candidate.distance_km,
        activityScore: candidate.activity_score,
        matchScore,
      };
    });

    // Sort by match score and return the best one
    scoredCandidates.sort((a: ScoredCandidate, b: ScoredCandidate) => b.matchScore - a.matchScore);

    return scoredCandidates[0];
  } catch (error: any) {
    logger.error('Error finding match:', { error: error.message, stack: error.stack, userId: user.id });
    return null;
  }
}

