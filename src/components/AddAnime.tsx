"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Trash2, ArrowLeft, Subtitles, ChevronDown, ChevronUp, Play } from "lucide-react"
import { toast, ToastContainer } from "../utils/toast"
import { ANIME_GENRES, SUPPORTED_PLATFORMS, SUBTITLE_LANGUAGES, EPISODE_LANGUAGES } from "../types/anime"
import { useSupabaseAnime } from "../hooks/useSupabaseAnime"
import { LinkIcon, FileText } from "lucide-react" // Import LinkIcon and FileText

interface Subtitle {
  language: string
  url: string | null
  file_path: string | null
  file_name: string | null
}

interface EpisodeLink {
  platform: string
  url: string
  quality: string | null
  file_size: string | null
  subtitles: Subtitle[]
}

interface Episode {
  episode_number: number
  title: string
  description: string
  duration: string
  thumbnail_url: string
  language: string
  links: EpisodeLink[]
}

const COMMON_PLATFORMS = ["YouTube", "Dailymotion", "Vimeo", "Netflix", "Crunchyroll", "HiDive"]
const COMMON_GENRES = [
  "Action",
  "Adventure",
  "Comedy",
  "Drama",
  "Fantasy",
  "Horror",
  "Mystery",
  "Romance",
  "Sci-Fi",
  "Slice of Life",
  "Supernatural",
  "Thriller",
]

const AddAnime = ({ onSuccess }: { onSuccess?: () => void }) => {
  const { addAnime } = useSupabaseAnime()

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    synopsis: "",
    thumbnail_url: "",
    genres: [] as string[],
    rating: 5,
    release_year: new Date().getFullYear(),
    status: "upcoming" as "ongoing" | "completed" | "upcoming",
    episode_count: 1,
    studio_name: "",
  })

  const [episodes, setEpisodes] = useState<Episode[]>([
    {
      episode_number: 1,
      title: "",
      description: "",
      duration: "",
      thumbnail_url: "",
      language: "Japanese",
      links: [],
    },
  ])

  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGenreToggle = (genre: string) => {
    setFormData((prev) => ({
      ...prev,
      genres: prev.genres.includes(genre) ? prev.genres.filter((g) => g !== genre) : [...prev.genres, genre],
    }))
  }

  const handleEpisodeCountChange = (count: number) => {
    if (count < 1) {
      toast.error("Episode count must be at least 1")
      return
    }

    if (count > 1000) {
      toast.error("Episode count cannot exceed 1000")
      return
    }

    setFormData((prev) => ({ ...prev, episode_count: count }))

    if (count > episodes.length) {
      const newEpisodes = []
      for (let i = episodes.length; i < count; i++) {
        newEpisodes.push({
          episode_number: i + 1,
          title: "",
          description: "",
          duration: "",
          thumbnail_url: "",
          language: "Japanese",
          links: [],
        })
      }
      setEpisodes([...episodes, ...newEpisodes])
    } else if (count < episodes.length) {
      const newEpisodes = episodes.slice(0, count)
      setEpisodes(newEpisodes)
      setExpandedEpisodes((prev) => new Set([...prev].filter((index) => index < count)))
    }
  }

  const updateEpisode = (index: number, field: keyof Episode, value: any) => {
    setEpisodes(episodes.map((episode, i) => (i === index ? { ...episode, [field]: value } : episode)))
  }

  const toggleEpisodeExpanded = (index: number) => {
    setExpandedEpisodes((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(index)) {
        newSet.delete(index)
      } else {
        newSet.add(index)
      }
      return newSet
    })
  }

  const addLinkToEpisode = (episodeIndex: number) => {
    if (episodes[episodeIndex].links.length >= 10) {
      toast.error("Maximum 10 links allowed per episode")
      return
    }
    updateEpisode(episodeIndex, "links", [
      ...episodes[episodeIndex].links,
      { platform: "", url: "", quality: "", file_size: "", subtitles: [] },
    ])
    toast.success("Link added to episode")
  }

  const updateEpisodeLink = (episodeIndex: number, linkIndex: number, field: string, value: string) => {
    if (field === "url" && value) {
      try {
        new URL(value)
      } catch {
        if (value.length > 10 && !value.startsWith("http")) {
          toast.warn("URL should start with http:// or https://")
        }
      }
    }

    const updatedLinks = episodes[episodeIndex].links.map((link, i) =>
      i === linkIndex ? { ...link, [field]: value } : link,
    )
    updateEpisode(episodeIndex, "links", updatedLinks)
  }

  const removeEpisodeLink = (episodeIndex: number, linkIndex: number) => {
    const updatedLinks = episodes[episodeIndex].links.filter((_, i) => i !== linkIndex)
    updateEpisode(episodeIndex, "links", updatedLinks)
    toast.success("Link removed")
  }

  const addSubtitleToEpisodeLink = (episodeIndex: number, linkIndex: number) => {
    const currentSubtitles = episodes[episodeIndex].links[linkIndex].subtitles || []
    if (currentSubtitles.length >= 5) {
      toast.error("Maximum 5 subtitles allowed per link")
      return
    }
    const updatedLinks = episodes[episodeIndex].links.map((link, i) =>
      i === linkIndex
        ? { ...link, subtitles: [...currentSubtitles, { language: "", url: "", file_path: "", file_name: "" }] }
        : link,
    )
    updateEpisode(episodeIndex, "links", updatedLinks)
    toast.success("Subtitle option added")
  }

  const updateEpisodeLinkSubtitle = (
    episodeIndex: number,
    linkIndex: number,
    subtitleIndex: number,
    field: string,
    value: string,
  ) => {
    const updatedLinks = episodes[episodeIndex].links.map((link, i) =>
      i === linkIndex
        ? {
            ...link,
            subtitles: (link.subtitles || []).map((subtitle, j) =>
              j === subtitleIndex ? { ...subtitle, [field]: value } : subtitle,
            ),
          }
        : link,
    )
    updateEpisode(episodeIndex, "links", updatedLinks)
  }

  const updateEpisodeLinkSubtitleFile = (
    episodeIndex: number,
    linkIndex: number,
    subtitleIndex: number,
    file: File | undefined,
  ) => {
    const updatedLinks = episodes[episodeIndex].links.map((link, i) =>
      i === linkIndex
        ? {
            ...link,
            subtitles: (link.subtitles || []).map((subtitle, j) =>
              j === subtitleIndex
                ? {
                    ...subtitle,
                    file_path: file ? `uploads/${file.name}` : "",
                    file_name: file ? file.name : "",
                  }
                : subtitle,
            ),
          }
        : link,
    )
    updateEpisode(episodeIndex, "links", updatedLinks)
  }

  const removeEpisodeLinkSubtitle = (episodeIndex: number, linkIndex: number, subtitleIndex: number) => {
    const updatedLinks = episodes[episodeIndex].links.map((link, i) =>
      i === linkIndex ? { ...link, subtitles: (link.subtitles || []).filter((_, j) => j !== subtitleIndex) } : link,
    )
    updateEpisode(episodeIndex, "links", updatedLinks)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    // Validation
    if (!formData.title.trim()) {
      setError("Title is required")
      setLoading(false)
      toast.error("Title is required")
      return
    }

    if (formData.genres.length === 0) {
      setError("At least one genre must be selected")
      setLoading(false)
      toast.error("At least one genre must be selected")
      return
    }

    if (episodes.length === 0) {
      setError("At least one episode is required")
      setLoading(false)
      toast.error("At least one episode is required")
      return
    }

    // Validate episodes have required URLs
    const episodesWithoutLinks = episodes.filter(
      (ep) => ep.links.length === 0 || !ep.links.some((link) => link.platform && link.url),
    )
    if (episodesWithoutLinks.length > 0) {
      const episodeNumbers = episodesWithoutLinks.map((ep) => ep.episode_number).join(", ")
      setError(`Episodes ${episodeNumbers} need at least one valid link`)
      setLoading(false)
      toast.error(`Episodes ${episodeNumbers} need at least one valid link`)
      return
    }

    try {
      const animeData = {
        ...formData,
        episode_count: episodes.length,
        episodes: episodes.map((ep) => ({
          episode_number: ep.episode_number,
          title: ep.title || undefined,
          description: ep.description || undefined,
          duration: ep.duration || undefined,
          thumbnail_url: ep.thumbnail_url || undefined,
          language: ep.language,
          links: ep.links
            .filter((link) => link.platform && link.url)
            .map((link) => ({
              platform: link.platform,
              url: link.url,
              quality: link.quality || undefined,
              file_size: link.file_size || undefined,
              subtitles: (link.subtitles || [])
                .filter((sub) => sub.language && (sub.url || sub.file_path))
                .map((sub) => ({
                  language: sub.language,
                  url: sub.url || undefined,
                  file_path: sub.file_path || undefined,
                  file_name: sub.file_name || undefined,
                })),
            })),
        })),
      }

      await addAnime(animeData)
      toast.success(
        `Successfully added "${formData.title}" with ${episodes.length} episode${episodes.length !== 1 ? "s" : ""}!`,
      )
      onSuccess()
    } catch (err: any) {
      const errorMessage = err.message || "Failed to add anime"
      console.error("Error adding anime:", err)
      setError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="p-6">
        <div className="mb-6">
          <button
            onClick={onSuccess}
            className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back to Anime List</span>
          </button>
          <h1 className="text-3xl font-bold text-white">Add New Anime</h1>
          <p className="text-gray-400 mt-2">Create a new anime entry with multiple episodes and streaming links</p>
        </div>

        {error && <div className="mb-6 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-400">{error}</div>}

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Basic Anime Information */}
            <div>
              <h2 className="text-xl font-semibold text-white mb-4 border-b border-gray-700 pb-2">Basic Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Title *</label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="Enter anime title"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Studio Name</label>
                  <input
                    type="text"
                    value={formData.studio_name}
                    onChange={(e) => setFormData((prev) => ({ ...prev, studio_name: e.target.value }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="e.g., Studio Ghibli, Toei Animation"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Thumbnail URL</label>
                  <input
                    type="url"
                    value={formData.thumbnail_url}
                    onChange={(e) => {
                      const value = e.target.value
                      setFormData((prev) => ({ ...prev, thumbnail_url: value }))

                      if (value && value.length > 10) {
                        try {
                          new URL(value)
                        } catch {
                          // Don't show error immediately, user might still be typing
                        }
                      }
                    }}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Rating (0-10) *</label>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    step="0.1"
                    required
                    value={formData.rating || 5}
                    onChange={(e) => setFormData((prev) => ({ ...prev, rating: Number.parseFloat(e.target.value) }))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Release Year *</label>
                  <input
                    type="number"
                    min="1900"
                    max={new Date().getFullYear() + 5}
                    required
                    value={formData.release_year || new Date().getFullYear()}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, release_year: Number.parseInt(e.target.value) }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Status *</label>
                  <select
                    required
                    value={formData.status}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        status: e.target.value as "ongoing" | "completed" | "upcoming",
                      }))
                    }
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="upcoming">Upcoming</option>
                    <option value="ongoing">Ongoing</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Number of Episodes *</label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    required
                    value={formData.episode_count || 1}
                    onChange={(e) => handleEpisodeCountChange(Number.parseInt(e.target.value))}
                    className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    This will create {formData.episode_count} episode{formData.episode_count !== 1 ? "s" : ""} for you
                    to configure
                  </p>
                </div>
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Description</label>
                <textarea
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Brief description of the anime..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-2">Synopsis</label>
                <textarea
                  rows={4}
                  value={formData.synopsis}
                  onChange={(e) => setFormData((prev) => ({ ...prev, synopsis: e.target.value }))}
                  className="w-full bg-gray-700 border border-gray-600 rounded-lg px-4 py-2 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                  placeholder="Detailed plot summary or synopsis..."
                />
              </div>

              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-300 mb-3">Genres (select multiple) *</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-gray-700 p-4 rounded-lg max-h-48 overflow-y-auto">
                  {ANIME_GENRES.map((genre) => (
                    <label
                      key={genre}
                      className="flex items-center space-x-2 cursor-pointer hover:bg-gray-600 p-2 rounded"
                    >
                      <input
                        type="checkbox"
                        checked={formData.genres.includes(genre)}
                        onChange={() => handleGenreToggle(genre)}
                        className="w-4 h-4 text-purple-600 bg-gray-600 border-gray-500 rounded focus:ring-purple-500"
                      />
                      <span className="text-sm text-gray-300">{genre}</span>
                    </label>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Selected: {formData.genres.length > 0 ? formData.genres.join(", ") : "None"}
                </p>
              </div>
            </div>

            {/* Episodes Section - All Existing Episode Code */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-white border-b border-gray-700 pb-2">
                  Episodes ({episodes.length})
                </h2>
                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setExpandedEpisodes(new Set(episodes.map((_, i) => i)))}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors bg-gray-700 px-2 py-1 rounded"
                  >
                    Expand All
                  </button>
                  <button
                    type="button"
                    onClick={() => setExpandedEpisodes(new Set())}
                    className="text-xs text-purple-400 hover:text-purple-300 transition-colors bg-gray-700 px-2 py-1 rounded"
                  >
                    Collapse All
                  </button>
                </div>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {episodes.map((episode, episodeIndex) => {
                  const isExpanded = expandedEpisodes.has(episodeIndex)

                  return (
                    <div key={episodeIndex} className="bg-gray-700 rounded-lg border border-gray-600">
                      <div
                        className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-600/50 transition-colors"
                        onClick={() => toggleEpisodeExpanded(episodeIndex)}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center justify-center w-8 h-8 bg-purple-600 rounded-full text-white text-sm font-medium">
                            {episode.episode_number}
                          </div>
                          <div>
                            <h3 className="text-white font-medium">
                              Episode {episode.episode_number}
                              {episode.title && `: ${episode.title}`}
                            </h3>
                            <p className="text-xs text-gray-400">
                              {episode.links.length} link{episode.links.length !== 1 ? "s" : ""}
                              {episode.duration && ` • ${episode.duration}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Play className="h-4 w-4 text-purple-400" />
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-gray-400" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-gray-400" />
                          )}
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-gray-600 p-4 space-y-4">
                          {/* Episode Details */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-300 mb-1">Episode Title</label>
                              <input
                                type="text"
                                value={episode.title}
                                onChange={(e) => updateEpisode(episodeIndex, "title", e.target.value)}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="Episode title (optional)"
                              />
                            </div>

                            <div>
                              <label className="block text-xs font-medium text-gray-300 mb-1">Duration</label>
                              <input
                                type="text"
                                value={episode.duration}
                                onChange={(e) => updateEpisode(episodeIndex, "duration", e.target.value)}
                                className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                placeholder="e.g., 24:30"
                              />
                            </div>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Episode Language *</label>
                            <select
                              value={episode.language}
                              onChange={(e) => updateEpisode(episodeIndex, "language", e.target.value)}
                              className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                            >
                              {EPISODE_LANGUAGES.map((lang) => (
                                <option key={lang} value={lang}>
                                  {lang}
                                </option>
                              ))}
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">
                              Episode Thumbnail URL
                            </label>
                            <input
                              type="url"
                              value={episode.thumbnail_url}
                              onChange={(e) => updateEpisode(episodeIndex, "thumbnail_url", e.target.value)}
                              className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="Episode thumbnail URL (optional)"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-300 mb-1">Episode Description</label>
                            <textarea
                              rows={2}
                              value={episode.description}
                              onChange={(e) => updateEpisode(episodeIndex, "description", e.target.value)}
                              className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                              placeholder="Episode description or summary (optional)"
                            />
                          </div>

                          {/* Episode Links */}
                          <div>
                            <div className="flex items-center justify-between mb-3">
                              <label className="block text-xs font-medium text-gray-300">
                                Streaming & Download Links
                              </label>
                              <button
                                type="button"
                                onClick={() => addLinkToEpisode(episodeIndex)}
                                className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 transition-colors bg-gray-600 px-2 py-1 rounded"
                              >
                                <Plus className="h-3 w-3" />
                                <span>Add Link</span>
                              </button>
                            </div>

                            {episode.links.length === 0 ? (
                              <div className="bg-gray-600 border-2 border-dashed border-gray-500 rounded-lg p-4 text-center">
                                <p className="text-gray-400 text-xs">No links added for this episode</p>
                                <p className="text-gray-500 text-xs mt-1">
                                  Click "Add Link" to add streaming/download links
                                </p>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                {episode.links.map((link, linkIndex) => (
                                  <div key={linkIndex} className="bg-gray-600 p-3 rounded space-y-3">
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2">
                                      <select
                                        value={link.platform}
                                        onChange={(e) =>
                                          updateEpisodeLink(episodeIndex, linkIndex, "platform", e.target.value)
                                        }
                                        className="bg-gray-700 border border-gray-500 rounded px-3 py-2 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      >
                                        <option value="">Platform</option>
                                        {SUPPORTED_PLATFORMS.map((platform) => (
                                          <option key={platform} value={platform}>
                                            {platform}
                                          </option>
                                        ))}
                                      </select>
                                      <input
                                        type="text"
                                        placeholder="Quality (e.g., 1080p)"
                                        value={link.quality || ""} // Handle potential null
                                        onChange={(e) =>
                                          updateEpisodeLink(episodeIndex, linkIndex, "quality", e.target.value)
                                        }
                                        className="bg-gray-700 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      />
                                      <input
                                        type="text"
                                        placeholder="File size (e.g., 500MB)"
                                        value={link.file_size || ""} // Handle potential null
                                        onChange={(e) =>
                                          updateEpisodeLink(episodeIndex, linkIndex, "file_size", e.target.value)
                                        }
                                        className="bg-gray-700 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => removeEpisodeLink(episodeIndex, linkIndex)}
                                        className="p-2 text-red-400 hover:text-red-300 bg-gray-700 rounded transition-colors"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>

                                    <div>
                                      <input
                                        type="url"
                                        placeholder="Episode URL *"
                                        value={link.url}
                                        onChange={(e) =>
                                          updateEpisodeLink(episodeIndex, linkIndex, "url", e.target.value)
                                        }
                                        className="w-full bg-gray-700 border border-gray-500 rounded px-3 py-2 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                                      />
                                    </div>

                                    {/* Subtitles for this link */}
                                    <div className="border-t border-gray-500 pt-3">
                                      <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-medium text-gray-300 flex items-center space-x-1">
                                          <Subtitles className="h-3 w-3" />
                                          <span>Subtitles</span>
                                        </label>
                                        <button
                                          type="button"
                                          onClick={() => addSubtitleToEpisodeLink(episodeIndex, linkIndex)}
                                          className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 transition-colors bg-gray-700 px-2 py-1 rounded"
                                        >
                                          <Plus className="h-3 w-3" />
                                          <span>Add Subtitle</span>
                                        </button>
                                      </div>

                                      {(link.subtitles || []).length === 0 ? (
                                        <p className="text-xs text-gray-400 italic">No subtitles added</p>
                                      ) : (
                                        <div className="space-y-2">
                                          {(link.subtitles || []).map((subtitle, subtitleIndex) => (
                                            <div key={subtitleIndex} className="bg-gray-700 p-2 rounded space-y-2">
                                              <div className="flex items-center justify-between">
                                                <select
                                                  value={subtitle.language}
                                                  onChange={(e) =>
                                                    updateEpisodeLinkSubtitle(
                                                      episodeIndex,
                                                      linkIndex,
                                                      subtitleIndex,
                                                      "language",
                                                      e.target.value,
                                                    )
                                                  }
                                                  className="bg-gray-800 border border-gray-500 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                >
                                                  <option value="">Language</option>
                                                  {SUBTITLE_LANGUAGES.map((lang) => (
                                                    <option key={lang} value={lang}>
                                                      {lang}
                                                    </option>
                                                  ))}
                                                </select>
                                                <button
                                                  type="button"
                                                  onClick={() =>
                                                    removeEpisodeLinkSubtitle(episodeIndex, linkIndex, subtitleIndex)
                                                  }
                                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </button>
                                              </div>

                                              <div className="space-y-2">
                                                <div className="flex items-center space-x-2">
                                                  <LinkIcon className="h-3 w-3 text-purple-400" />
                                                  <input
                                                    type="url"
                                                    placeholder="Subtitle URL (optional)"
                                                    value={subtitle.url || ""} // Handle potential null
                                                    onChange={(e) =>
                                                      updateEpisodeLinkSubtitle(
                                                        episodeIndex,
                                                        linkIndex,
                                                        subtitleIndex,
                                                        "url",
                                                        e.target.value,
                                                      )
                                                    }
                                                    className="flex-1 bg-gray-800 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                                  />
                                                </div>

                                                <div className="flex items-center space-x-2">
                                                  <FileText className="h-3 w-3 text-blue-400" />
                                                  <div className="flex-1">
                                                    <input
                                                      type="file"
                                                      accept=".srt,.vtt,.ass,.ssa,.sub"
                                                      onChange={(e) =>
                                                        updateEpisodeLinkSubtitleFile(
                                                          episodeIndex,
                                                          linkIndex,
                                                          subtitleIndex,
                                                          e.target.files?.[0],
                                                        )
                                                      }
                                                      className="w-full text-xs text-gray-300 file:mr-1 file:py-1 file:px-2 file:rounded file:border-0 file:text-xs file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                                                    />
                                                    {subtitle.file_name && (
                                                      <p className="text-xs text-green-400 mt-1">
                                                        File: {subtitle.file_name}
                                                      </p>
                                                    )}
                                                  </div>
                                                </div>

                                                <p className="text-xs text-gray-400 italic">
                                                  Provide either a URL or upload a file
                                                </p>
                                              </div>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-700">
              <button
                type="button"
                onClick={onSuccess as () => void} // Cast to satisfy React.MouseEventHandler
                className="px-6 py-2 text-gray-300 bg-gray-700 rounded-lg hover:bg-gray-600 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-colors font-medium"
              >
                {loading ? "Adding..." : `Add Anime with ${episodes.length} Episode${episodes.length !== 1 ? "s" : ""}`}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </>
  )
}

export default AddAnime
