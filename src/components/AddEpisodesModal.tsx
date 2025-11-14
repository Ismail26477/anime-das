"use client"

import type React from "react"
import { useState } from "react"
import { Plus, Trash2, ArrowLeft, ChevronDown, ChevronUp, Play, X } from 'lucide-react'
import { toast } from "../utils/toast"
import { SUPPORTED_PLATFORMS, EPISODE_LANGUAGES } from "../types/anime"

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

interface NewEpisode {
  episode_number: number
  title: string
  description: string
  duration: string
  thumbnail_url: string
  language: string
  links: EpisodeLink[]
}

interface AddEpisodesModalProps {
  animeId: string
  animeTitle: string
  currentEpisodeCount: number
  onAddEpisodes: (animeId: string, episodes: NewEpisode[]) => Promise<void>
  onClose: () => void
}

const AddEpisodesModal: React.FC<AddEpisodesModalProps> = ({
  animeId,
  animeTitle,
  currentEpisodeCount,
  onAddEpisodes,
  onClose,
}) => {
  const [episodes, setEpisodes] = useState<NewEpisode[]>([
    {
      episode_number: currentEpisodeCount + 1,
      title: "",
      description: "",
      duration: "",
      thumbnail_url: "",
      language: "Japanese",
      links: [],
    },
  ])

  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(new Set([0]))
  const [loading, setLoading] = useState(false)

  const addEpisodeField = () => {
    const newEpisodeNumber = Math.max(...episodes.map((e) => e.episode_number)) + 1
    setEpisodes([
      ...episodes,
      {
        episode_number: newEpisodeNumber,
        title: "",
        description: "",
        duration: "",
        thumbnail_url: "",
        language: "Japanese",
        links: [],
      },
    ])
  }

  const updateEpisode = (index: number, field: keyof NewEpisode, value: any) => {
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
  }

  const updateEpisodeLink = (episodeIndex: number, linkIndex: number, field: string, value: string) => {
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

  const removeEpisode = (index: number) => {
    if (episodes.length === 1) {
      toast.error("You must have at least one episode")
      return
    }
    setEpisodes(episodes.filter((_, i) => i !== index))
    setExpandedEpisodes((prev) => new Set([...prev].filter((i) => i !== index)))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Validation
    const episodesWithoutLinks = episodes.filter(
      (ep) => ep.links.length === 0 || !ep.links.some((link) => link.platform && link.url),
    )
    if (episodesWithoutLinks.length > 0) {
      const episodeNumbers = episodesWithoutLinks.map((ep) => ep.episode_number).join(", ")
      toast.error(`Episodes ${episodeNumbers} need at least one valid link`)
      setLoading(false)
      return
    }

    try {
      const formattedEpisodes = episodes.map((ep) => ({
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
          })),
      }))

      await onAddEpisodes(animeId, formattedEpisodes)
      toast.success(`Successfully added ${episodes.length} episode${episodes.length !== 1 ? "s" : ""}!`)
      onClose()
    } catch (err: any) {
      toast.error(err.message || "Failed to add episodes")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 rounded-lg border border-gray-700 w-full max-w-2xl max-h-96 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 flex-shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-white">Add Episodes to {animeTitle}</h2>
            <p className="text-sm text-gray-400">Current episodes: {currentEpisodeCount}</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-4 space-y-3">
          {episodes.map((episode, episodeIndex) => {
            const isExpanded = expandedEpisodes.has(episodeIndex)

            return (
              <div key={episodeIndex} className="bg-gray-700 rounded-lg border border-gray-600">
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:bg-gray-600/50 transition-colors"
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
                      <p className="text-xs text-gray-400">{episode.links.length} link(s)</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {episodes.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          removeEpisode(episodeIndex)
                        }}
                        className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                      <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                  </div>
                </div>

                {isExpanded && (
                  <div className="border-t border-gray-600 p-3 space-y-3">
                    {/* Episode Details */}
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Title</label>
                        <input
                          type="text"
                          value={episode.title}
                          onChange={(e) => updateEpisode(episodeIndex, "title", e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="Episode title"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-300 mb-1">Duration</label>
                        <input
                          type="text"
                          value={episode.duration}
                          onChange={(e) => updateEpisode(episodeIndex, "duration", e.target.value)}
                          className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                          placeholder="24:30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Language</label>
                      <select
                        value={episode.language}
                        onChange={(e) => updateEpisode(episodeIndex, "language", e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                      >
                        {EPISODE_LANGUAGES.map((lang) => (
                          <option key={lang} value={lang}>
                            {lang}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-medium text-gray-300 mb-1">Description</label>
                      <textarea
                        rows={2}
                        value={episode.description}
                        onChange={(e) => updateEpisode(episodeIndex, "description", e.target.value)}
                        className="w-full bg-gray-600 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
                        placeholder="Episode summary"
                      />
                    </div>

                    {/* Links Section */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-medium text-gray-300">Links *</label>
                        <button
                          type="button"
                          onClick={() => addLinkToEpisode(episodeIndex)}
                          className="flex items-center space-x-1 text-xs text-purple-400 hover:text-purple-300 bg-gray-600 px-2 py-1 rounded"
                        >
                          <Plus className="h-3 w-3" />
                          <span>Add Link</span>
                        </button>
                      </div>

                      {episode.links.length === 0 ? (
                        <p className="text-xs text-gray-400 italic">No links added yet</p>
                      ) : (
                        <div className="space-y-2">
                          {episode.links.map((link, linkIndex) => (
                            <div key={linkIndex} className="bg-gray-600 p-2 rounded space-y-2">
                              <div className="grid grid-cols-3 gap-1">
                                <select
                                  value={link.platform}
                                  onChange={(e) =>
                                    updateEpisodeLink(episodeIndex, linkIndex, "platform", e.target.value)
                                  }
                                  className="bg-gray-700 border border-gray-500 rounded px-2 py-1 text-white text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
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
                                  placeholder="Quality"
                                  value={link.quality || ""}
                                  onChange={(e) =>
                                    updateEpisodeLink(episodeIndex, linkIndex, "quality", e.target.value)
                                  }
                                  className="bg-gray-700 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeEpisodeLink(episodeIndex, linkIndex)}
                                  className="p-1 text-red-400 hover:text-red-300 transition-colors"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </button>
                              </div>
                              <input
                                type="url"
                                placeholder="Episode URL *"
                                value={link.url}
                                onChange={(e) => updateEpisodeLink(episodeIndex, linkIndex, "url", e.target.value)}
                                className="w-full bg-gray-700 border border-gray-500 rounded px-2 py-1 text-white placeholder-gray-400 text-xs focus:outline-none focus:ring-1 focus:ring-purple-500"
                              />
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

        {/* Footer */}
        <div className="border-t border-gray-700 p-4 flex items-center justify-between flex-shrink-0">
          <button
            type="button"
            onClick={addEpisodeField}
            className="flex items-center space-x-2 px-3 py-2 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 transition-colors text-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Another Episode</span>
          </button>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-300 bg-gray-700 rounded hover:bg-gray-600 transition-colors text-sm"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded hover:from-purple-700 hover:to-blue-700 transition-colors font-medium text-sm disabled:opacity-50"
            >
              {loading ? "Adding..." : `Add ${episodes.length} Episode${episodes.length !== 1 ? "s" : ""}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddEpisodesModal
