import { useState, useEffect } from "react"
import { supabase } from "../lib/supabase"

export interface Episode {
  id: string
  anime_id: string
  episode_number: number
  title: string | null
  description: string | null
  duration: string | null
  thumbnail_url: string | null
  language: string
  created_at: string
  updated_at: string
  links: Array<{
    id: string
    platform: string
    url: string
    quality: string | null
    file_size: string | null
    subtitles: Array<{
      id: string
      language: string
      url: string | null
      file_path: string | null
      file_name: string | null
    }>
  }>
}

export interface AnimeWithDetails {
  id: string
  title: string
  description: string
  synopsis: string
  release_year: number
  episode_count: number
  studio_id: string | null
  studio_name: string | null
  rating: number
  status: "ongoing" | "completed" | "upcoming"
  thumbnail_url: string | null
  created_at: string
  updated_at: string
  added_by: string
  is_archived: boolean
  episodes: Episode[]
  genres?: string[]
}

export function useSupabaseAnime() {
  const [anime, setAnime] = useState<AnimeWithDetails[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnime()
  }, [])

  const fetchAnime = async () => {
    try {
      setLoading(true)
      console.log("[v0] Fetching anime from Supabase...")

      const { data: animeData, error: animeError } = await supabase
        .from("anime")
        .select(`
          *,
          episodes (
            *,
            episode_links (*)
          )
        `)
        .eq("is_archived", false)
        .order("created_at", { ascending: false })

      if (animeError) {
        console.error("[v0] Error fetching anime:", animeError)
        setAnime([])
        return
      }

      console.log("[v0] Anime fetched successfully:", animeData?.length || 0, "items")

      // Now fetch subtitles separately for each anime
      const transformedAnime: AnimeWithDetails[] = await Promise.all(
        (animeData || []).map(async (anime: any) => {
          const { data: subtitles, error: subtitleError } = await supabase
            .from("subtitles")
            .select("*")
            .eq("anime_id", anime.id)

          if (subtitleError) {
            console.warn("[v0] Error fetching subtitles for anime", anime.id, subtitleError)
          }

          // Create a map of subtitles by link (we'll match them based on the data)
          const subtitlesByLink: Record<string, any[]> = {}

          return {
            ...anime,
            genres: anime.genres || [],
            episodes: (anime.episodes || []).map((episode: any) => ({
              ...episode,
              links: (episode.episode_links || []).map((link: any) => ({
                id: link.id,
                platform: link.platform,
                url: link.url,
                quality: link.quality,
                file_size: link.file_size,
                subtitles: (subtitles || []).filter((sub: any) => sub.anime_id === anime.id),
              })),
            })),
          }
        }),
      )

      setAnime(transformedAnime)
    } catch (error) {
      console.error("[v0] Error in fetchAnime:", error)
      setAnime([])
    } finally {
      setLoading(false)
    }
  }

  const addAnime = async (animeData: {
    title: string
    description?: string
    synopsis?: string
    thumbnail_url?: string
    rating: number
    release_year: number
    status: "ongoing" | "completed" | "upcoming"
    episode_count?: number
    studio_name?: string
    genres: string[]
    episodes: Array<{
      episode_number: number
      title?: string
      description?: string
      duration?: string
      thumbnail_url?: string
      language?: string
      links: Array<{
        platform: string
        url: string
        quality?: string
        file_size?: string
      }>
    }>
  }) => {
    try {
      console.log("[v0] Adding anime:", animeData.title)

      const { data: newAnime, error: animeError } = await supabase
        .from("anime")
        .insert({
          title: animeData.title,
          description: animeData.description || "",
          synopsis: animeData.synopsis || animeData.description || "",
          release_year: animeData.release_year,
          episode_count: animeData.episode_count || animeData.episodes.length,
          studio_name: animeData.studio_name || null,
          rating: animeData.rating || 0,
          status: animeData.status,
          thumbnail_url: animeData.thumbnail_url || null,
          is_archived: false,
        })
        .select()
        .single()

      if (animeError) {
        console.error("[v0] Error inserting anime:", animeError)
        throw new Error("Failed to add anime: " + animeError.message)
      }

      console.log("[v0] Anime created with ID:", newAnime.id)

      for (const episodeData of animeData.episodes) {
        const { data: newEpisode, error: episodeError } = await supabase
          .from("episodes")
          .insert({
            anime_id: newAnime.id,
            episode_number: episodeData.episode_number,
            title: episodeData.title || null,
            description: episodeData.description || null,
            duration: episodeData.duration || null,
            thumbnail_url: episodeData.thumbnail_url || null,
            language: episodeData.language || "Japanese",
          })
          .select()
          .single()

        if (episodeError) {
          console.error("[v0] Error inserting episode:", episodeError)
          continue
        }

        console.log("[v0] Episode created:", newEpisode.id, "Language:", episodeData.language || "Japanese")

        for (const linkData of episodeData.links) {
          const platformName = linkData.platform.trim()
          if (!platformName || !linkData.url.trim()) {
            console.warn("[v0] Skipping link with missing platform or URL")
            continue
          }

          const { data: newLink, error: linkError } = await supabase
            .from("episode_links")
            .insert({
              episode_id: newEpisode.id,
              platform: platformName,
              url: linkData.url.trim(),
              quality: linkData.quality?.trim() || null,
              file_size: linkData.file_size?.trim() || null,
            })
            .select()
            .single()

          if (linkError) {
            console.error("[v0] Error inserting episode link:", linkError)
            continue
          }

          console.log("[v0] Link created:", newLink.id)
        }
      }

      console.log("[v0] Anime added successfully")

      // Refresh anime list
      await fetchAnime()

      return newAnime
    } catch (error) {
      console.error("[v0] Error in addAnime:", error)
      throw error
    }
  }

  const updateAnime = async (id: string, updates: Partial<AnimeWithDetails>) => {
    try {
      const allowedFields = [
        'title',
        'description',
        'synopsis',
        'thumbnail_url',
        'rating',
        'release_year',
        'status',
        'studio_name',
        'is_archived',
        'episode_count'
      ];

      const dbUpdates: Record<string, any> = {};
      allowedFields.forEach(field => {
        if (field in updates) {
          dbUpdates[field] = updates[field as keyof typeof updates];
        }
      });

      console.log("[v0] Updating anime with:", dbUpdates);

      const { error } = await supabase
        .from("anime")
        .update({
          ...dbUpdates,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)

      if (error) {
        console.error("[v0] Error updating anime:", error)
        throw new Error(error.message || "Failed to update anime")
      }

      console.log("[v0] Anime updated successfully")

      // Refresh anime list
      await fetchAnime()
    } catch (error) {
      console.error("[v0] Error in updateAnime:", error)
      throw error
    }
  }

  const deleteAnime = async (id: string) => {
    try {
      const { error } = await supabase.from("anime").delete().eq("id", id)

      if (error) {
        console.error("[v0] Error deleting anime:", error)
        throw new Error("Failed to delete anime")
      }

      // Refresh anime list
      await fetchAnime()
    } catch (error) {
      console.error("[v0] Error in deleteAnime:", error)
      throw error
    }
  }

  const addLinksToAnime = async (
    animeId: string,
    links: Array<{
      platform: string
      url: string
      quality?: string
      file_size?: string
      subtitles?: Array<{
        language: string
        url?: string
        file_path?: string
        file_name?: string
      }>
    }>,
    episodeLanguage = "Japanese",
  ) => {
    try {
      // Find the first episode for this anime
      const { data: episodes, error: episodesError } = await supabase
        .from("episodes")
        .select("id")
        .eq("anime_id", animeId)
        .order("episode_number", { ascending: true })
        .limit(1)

      if (episodesError || !episodes || episodes.length === 0) {
        throw new Error("No episodes found for this anime")
      }

      const episodeId = episodes[0].id

      // Update episode language if needed
      if (episodeLanguage && episodeLanguage !== "Japanese") {
        const { error: updateError } = await supabase
          .from("episodes")
          .update({ language: episodeLanguage })
          .eq("id", episodeId)

        if (updateError) {
          console.warn("[v0] Warning: Could not update episode language:", updateError)
        }
      }

      // Add links to the episode
      for (const linkData of links) {
        const platformName = linkData.platform.trim()
        if (!platformName || !linkData.url.trim()) {
          console.warn("[v0] Skipping link with missing platform or URL")
          continue
        }

        const { data: newLink, error: linkError } = await supabase
          .from("episode_links")
          .insert({
            episode_id: episodeId,
            platform: platformName,
            url: linkData.url.trim(),
            quality: linkData.quality?.trim() || null,
            file_size: linkData.file_size?.trim() || null,
          })
          .select()
          .single()

        if (linkError) {
          console.error("[v0] Error inserting episode link:", linkError)
          continue
        }

        console.log("[v0] Link created:", newLink.id)

        // Add subtitles
        if (linkData.subtitles && linkData.subtitles.length > 0) {
          for (const subtitleData of linkData.subtitles) {
            if (subtitleData.language && (subtitleData.url || subtitleData.file_path)) {
              const { error: subtitleError } = await supabase.from("subtitles").insert({
                anime_id: animeId,
                language: subtitleData.language,
                url: subtitleData.url || null,
                file_path: subtitleData.file_path || null,
                file_name: subtitleData.file_name || null,
              })

              if (subtitleError) {
                console.error("[v0] Error inserting subtitle:", subtitleError)
              }
            }
          }
        }
      }

      // Refresh anime list
      await fetchAnime()
    } catch (error) {
      console.error("[v0] Error in addLinksToAnime:", error)
      throw error
    }
  }

  const addEpisodes = async (
    animeId: string,
    episodes: Array<{
      episode_number: number
      title?: string
      description?: string
      duration?: string
      thumbnail_url?: string
      language?: string
      links: Array<{
        platform: string
        url: string
        quality?: string
        file_size?: string
      }>
    }>,
  ) => {
    try {
      console.log("[v0] Adding episodes to anime:", animeId)

      for (const episodeData of episodes) {
        const { data: newEpisode, error: episodeError } = await supabase
          .from("episodes")
          .insert({
            anime_id: animeId,
            episode_number: episodeData.episode_number,
            title: episodeData.title || null,
            description: episodeData.description || null,
            duration: episodeData.duration || null,
            thumbnail_url: episodeData.thumbnail_url || null,
            language: episodeData.language || "Japanese",
          })
          .select()
          .single()

        if (episodeError) {
          console.error("[v0] Error inserting episode:", episodeError)
          continue
        }

        console.log("[v0] Episode created:", newEpisode.id)

        for (const linkData of episodeData.links) {
          const platformName = linkData.platform.trim()
          if (!platformName || !linkData.url.trim()) {
            console.warn("[v0] Skipping link with missing platform or URL")
            continue
          }

          const { error: linkError } = await supabase
            .from("episode_links")
            .insert({
              episode_id: newEpisode.id,
              platform: platformName,
              url: linkData.url.trim(),
              quality: linkData.quality?.trim() || null,
              file_size: linkData.file_size?.trim() || null,
            })
            .select()
            .single()

          if (linkError) {
            console.error("[v0] Error inserting episode link:", linkError)
            continue
          }

          console.log("[v0] Link created for episode:", newEpisode.id)
        }
      }

      const { data: currentAnime, error: fetchError } = await supabase
        .from("anime")
        .select("episode_count")
        .eq("id", animeId)
        .single()

      if (!fetchError && currentAnime) {
        const newEpisodeCount = currentAnime.episode_count + episodes.length
        await supabase.from("anime").update({ episode_count: newEpisodeCount }).eq("id", animeId)
      }

      console.log("[v0] Episodes added successfully")

      // Refresh anime list
      await fetchAnime()

      return true
    } catch (error) {
      console.error("[v0] Error in addEpisodes:", error)
      throw error
    }
  }

  return {
    anime,
    loading,
    addAnime,
    updateAnime,
    deleteAnime,
    addLinksToAnime,
    addEpisodes,
    refetch: fetchAnime,
  }
}
