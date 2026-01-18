import type { SpotifyTrack, SpotifyArtist, SpotifyAudioFeatures } from './spotifyService';

export interface MusicEmbedding {
  embedding: number[]; // 17-dimensional vector
  topArtists: Array<{
    name: string;
    spotify_id: string;
    image: string | null;
    genres: string[];
  }>;
  topGenres: Array<{
    name: string;
    weight: number;
  }>;
  topTracks: Array<{
    name: string;
    artist: string;
    spotify_id: string;
  }>;
}

export class EmbeddingService {
  /**
   * Generate user music embedding from Spotify data
   * Returns 17-dimensional vector: [7 audio features, 10 genre dimensions]
   */
  async generateMusicEmbedding(
    topTracks: SpotifyTrack[],
    topArtists: SpotifyArtist[],
    audioFeatures: SpotifyAudioFeatures[]
  ): Promise<MusicEmbedding> {
    // Extract audio features vector (7 dimensions)
    const audioVector = this.computeAudioVector(audioFeatures);

    // Extract genre vector (10 dimensions)
    const genreVector = this.computeGenreVector(topArtists);

    // Combine into 17-dimensional embedding
    const embedding = [...audioVector, ...genreVector];

    // Prepare top artists data (top 10)
    const topArtistsData = topArtists.slice(0, 10).map((artist) => ({
      name: artist.name,
      spotify_id: artist.id,
      image: artist.images[0]?.url || null,
      genres: artist.genres,
    }));

    // Prepare top genres with weights
    const genreCounts: Record<string, number> = {};
    topArtists.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    const topGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]: [string, number]) => ({
        name,
        weight: count / topArtists.length, // Normalize by total artists
      }));

    // Prepare top tracks data (top 5)
    const topTracksData = topTracks.slice(0, 5).map((track) => ({
      name: track.name,
      artist: track.artists[0]?.name || 'Unknown',
      spotify_id: track.id,
    }));

    return {
      embedding,
      topArtists: topArtistsData,
      topGenres,
      topTracks: topTracksData,
    };
  }

  /**
   * Compute audio features vector (7 dimensions)
   * Averages audio features across all tracks
   */
  private computeAudioVector(
    audioFeatures: SpotifyAudioFeatures[]
  ): number[] {
    if (audioFeatures.length === 0) {
      return new Array(7).fill(0);
    }

    const features: Array<keyof SpotifyAudioFeatures> = [
      'valence',
      'energy',
      'danceability',
      'acousticness',
      'instrumentalness',
      'tempo',
      'loudness',
    ];

    const averages = features.map((feature) => {
      const values = audioFeatures.map((af) => {
        let value = af[feature] as number;

        // Normalize tempo (typical range: 60-200 BPM)
        if (feature === 'tempo') {
          value = value / 200; // Normalize to 0-1 range
        }

        // Normalize loudness (typical range: -60 to 0 dB)
        if (feature === 'loudness') {
          value = (value + 60) / 60; // Normalize to 0-1 range
        }

        return value;
      });

      const sum = values.reduce((a, b) => a + b, 0);
      return sum / values.length;
    });

    return averages;
  }

  /**
   * Compute genre vector (10 dimensions)
   * Creates frequency-based vector from top genres
   */
  private computeGenreVector(topArtists: SpotifyArtist[]): number[] {
    if (topArtists.length === 0) {
      return new Array(10).fill(0);
    }

    // Extract all genres from top artists
    const genreCounts: Record<string, number> = {};
    topArtists.forEach((artist) => {
      artist.genres.forEach((genre) => {
        genreCounts[genre] = (genreCounts[genre] || 0) + 1;
      });
    });

    // Get top 10 genres by frequency
    const sortedGenres = Object.entries(genreCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Create 10-dimensional vector (normalize by max count)
    const maxCount = sortedGenres[0]?.[1] || 1;
    const genreVector = new Array(10).fill(0);

    sortedGenres.forEach(([, count]: [string, number], idx: number) => {
      genreVector[idx] = count / maxCount;
    });

    return genreVector;
  }

  /**
   * Calculate cosine similarity between two embeddings
   * Returns value between 0 (no similarity) and 1 (identical)
   */
  cosineSimilarity(embedding1: number[], embedding2: number[]): number {
    if (embedding1.length !== embedding2.length) {
      throw new Error('Embeddings must have the same dimension');
    }

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    for (let i = 0; i < embedding1.length; i++) {
      dotProduct += embedding1[i] * embedding2[i];
      norm1 += embedding1[i] ** 2;
      norm2 += embedding2[i] ** 2;
    }

    const denominator = Math.sqrt(norm1) * Math.sqrt(norm2);
    if (denominator === 0) {
      return 0;
    }

    return dotProduct / denominator;
  }

  /**
   * Calculate match score combining music similarity, distance, and activity
   */
  calculateMatchScore(
    musicSimilarity: number,
    distanceKm: number,
    activityScore: number,
    maxDistanceKm: number = 50
  ): number {
    const distanceScore = 1 - Math.min(distanceKm / maxDistanceKm, 1);
    return (
      0.6 * musicSimilarity + 0.3 * distanceScore + 0.1 * activityScore
    );
  }
}

export const embeddingService = new EmbeddingService();

