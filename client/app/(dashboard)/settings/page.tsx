"use client"

import { useAuth, useUser } from "@clerk/nextjs"
import {
  AlertCircle,
  ArrowLeft,
  Bell,
  Camera,
  CheckCircle,
  Database,
  Loader2,
  Mail,
  Palette,
  Save,
  Shield,
  Trash2,
  User,
  X,
} from "lucide-react"
import { useRouter } from "next/navigation"
import { ChangeEvent, useEffect, useRef, useState } from "react"

interface ProfileFormData {
  firstName: string
  lastName: string
  bio: string
  location: string
  website: string
}

interface Toast {
  id: string
  type: "success" | "error" | "info"
  message: string
}

export default function SettingsPage() {
  const { user, isLoaded } = useUser()
  const { isSignedIn } = useAuth()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [toasts, setToasts] = useState<Toast[]>([])
  const [activeTab, setActiveTab] = useState<
    "profile" | "preferences" | "data"
  >("profile")

  const [formData, setFormData] = useState<ProfileFormData>({
    firstName: user?.firstName || "",
    lastName: user?.lastName || "",
    bio: (user?.unsafeMetadata?.bio as string) || "",
    location: (user?.unsafeMetadata?.location as string) || "",
    website: (user?.unsafeMetadata?.website as string) || "",
  })

  const [preferences, setPreferences] = useState({
    emailNotifications: true,
    darkMode: "system",
    language: "en",
  })

  // Load preferences from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user-preferences")
      if (saved) {
        try {
          setPreferences(JSON.parse(saved))
        } catch {
          // Ignore parse errors
        }
      }
    }
  }, [])

  // Sync formData when user data loads
  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        bio: (user.unsafeMetadata?.bio as string) || "",
        location: (user.unsafeMetadata?.location as string) || "",
        website: (user.unsafeMetadata?.website as string) || "",
      })
    }
  }, [user])

  // Add toast notification
  const addToast = (type: Toast["type"], message: string) => {
    const id = crypto.randomUUID()
    setToasts((prev) => [...prev, { id, type, message }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, 4000)
  }

  // Handle profile image upload
  const handleImageUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      addToast("error", "Please select a valid image file")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      addToast("error", "Image must be less than 5MB")
      return
    }

    try {
      setIsLoading(true)
      // Directly upload to Clerk without FileReader
      await user?.setProfileImage({ file })
      addToast("success", "Profile image updated successfully")
    } catch (error) {
      console.error("Failed to upload image:", error)
      addToast("error", "Failed to upload image. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle profile data update
  const handleUpdateProfile = async () => {
    try {
      setIsLoading(true)

      // Update Clerk user fields
      await user?.update({
        firstName: formData.firstName,
        lastName: formData.lastName,
      })

      // Note: For custom metadata, you'd need to sync with your backend
      // Clerk's public API doesn't expose updateMetadata directly
      // In production, create an API endpoint to update user metadata in your database

      addToast("success", "Profile updated successfully")
      setIsEditing(false)
    } catch (error) {
      console.error("Failed to update profile:", error)
      addToast("error", "Failed to update profile. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  // Handle preference changes
  const handlePreferenceChange = async (key: string, value: unknown) => {
    const newPreferences = { ...preferences, [key]: value }
    setPreferences(newPreferences)
    // Persist to localStorage
    if (typeof window !== "undefined") {
      localStorage.setItem("user-preferences", JSON.stringify(newPreferences))
    }
  }

  // Format date
  const formatDate = (date?: Date | null) => {
    if (!date) return "Not available"
    return new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    }).format(date)
  }

  if (!isLoaded) {
    return (
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Loader2
          size={32}
          color="var(--accent)"
          style={{ animation: "spin 1s linear infinite" }}
        />
      </div>
    )
  }

  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        padding: "clamp(16px, 3vw, 32px)",
        maxWidth: "900px",
        width: "100%",
        margin: "0 auto",
        boxSizing: "border-box",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        {/* Back Button */}
        <button
          type="button"
          onClick={() => router.back()}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            padding: "8px 12px",
            marginBottom: "16px",
            background: "var(--bg-surface)",
            border: "1px solid var(--border-default)",
            borderRadius: "8px",
            color: "var(--text-secondary)",
            fontSize: "14px",
            fontWeight: 500,
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "var(--bg-surface-hover)"
            e.currentTarget.style.color = "var(--text-primary)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "var(--bg-surface)"
            e.currentTarget.style.color = "var(--text-secondary)"
          }}
        >
          <ArrowLeft size={16} />
          Back
        </button>

        <h1
          style={{
            fontSize: "clamp(24px, 4vw, 28px)",
            fontWeight: 700,
            color: "var(--text-primary)",
            margin: "0 0 8px",
            letterSpacing: "-0.5px",
          }}
        >
          Settings
        </h1>
        <p
          style={{
            fontSize: "14px",
            color: "var(--text-secondary)",
            margin: 0,
          }}
        >
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div
        style={{
          display: "flex",
          gap: "8px",
          marginBottom: "24px",
          borderBottom: "1px solid var(--border-default)",
          paddingBottom: "1px",
          overflowX: "auto",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {[
          { id: "profile", label: "Profile", icon: User },
          { id: "preferences", label: "Preferences", icon: Palette },
          { id: "data", label: "Data & Storage", icon: Database },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              background: "none",
              border: "none",
              borderBottom:
                activeTab === tab.id
                  ? "2px solid var(--accent)"
                  : "2px solid transparent",
              color:
                activeTab === tab.id
                  ? "var(--accent)"
                  : "var(--text-secondary)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
              marginBottom: "-1px",
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = "var(--text-primary)"
              }
            }}
            onMouseLeave={(e) => {
              if (activeTab !== tab.id) {
                e.currentTarget.style.color = "var(--text-secondary)"
              }
            }}
          >
            <tab.icon size={16} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Profile Tab */}
      {activeTab === "profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Profile Card */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "24px",
                borderBottom: "1px solid var(--border-default)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "24px",
                }}
              >
                {/* Profile Image */}
                <div style={{ position: "relative" }}>
                  <div
                    style={{
                      width: "100px",
                      height: "100px",
                      borderRadius: "50%",
                      background: user?.imageUrl
                        ? `url(${user.imageUrl}) center/cover`
                        : "var(--accent)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "36px",
                      fontWeight: 700,
                      color: user?.imageUrl
                        ? "transparent"
                        : "var(--primary-foreground)",
                      overflow: "hidden",
                      border: "3px solid var(--border-default)",
                    }}
                  >
                    {!user?.imageUrl &&
                      (user?.firstName?.[0] || user?.lastName?.[0] || "U")}
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    style={{ display: "none" }}
                    onChange={handleImageUpload}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    style={{
                      position: "absolute",
                      bottom: "4px",
                      right: "4px",
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      background: "var(--accent)",
                      border: "2px solid var(--bg-secondary)",
                      color: "var(--primary-foreground)",
                      cursor: isLoading ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      opacity: isLoading ? 0.7 : 1,
                      transition: "all 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = "scale(1.1)"
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isLoading) {
                        e.currentTarget.style.transform = "scale(1)"
                      }
                    }}
                  >
                    {isLoading ? (
                      <Loader2
                        size={14}
                        style={{ animation: "spin 1s linear infinite" }}
                      />
                    ) : (
                      <Camera size={14} />
                    )}
                  </button>
                </div>

                {/* Profile Info */}
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "12px",
                      marginBottom: "8px",
                    }}
                  >
                    <h2
                      style={{
                        fontSize: "20px",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        margin: 0,
                      }}
                    >
                      {user?.fullName || "Not set"}
                    </h2>
                    {!isEditing ? (
                      <button
                        type="button"
                        onClick={() => setIsEditing(true)}
                        style={{
                          padding: "6px 12px",
                          borderRadius: "6px",
                          background: "var(--bg-surface-hover)",
                          border: "1px solid var(--border-default)",
                          color: "var(--text-secondary)",
                          fontSize: "13px",
                          fontWeight: 500,
                          cursor: "pointer",
                          transition: "all 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--accent)"
                          e.currentTarget.style.color =
                            "var(--primary-foreground)"
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background =
                            "var(--bg-surface-hover)"
                          e.currentTarget.style.color = "var(--text-secondary)"
                        }}
                      >
                        Edit Profile
                      </button>
                    ) : (
                      <div style={{ display: "flex", gap: "8px" }}>
                        <button
                          type="button"
                          onClick={handleUpdateProfile}
                          disabled={isLoading}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "var(--accent)",
                            border: "none",
                            color: "var(--primary-foreground)",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.15s",
                          }}
                        >
                          {isLoading ? (
                            <Loader2
                              size={14}
                              style={{ animation: "spin 1s linear infinite" }}
                            />
                          ) : (
                            <Save size={14} />
                          )}
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditing(false)
                            setFormData({
                              firstName: user?.firstName || "",
                              lastName: user?.lastName || "",
                              bio: (user?.unsafeMetadata?.bio as string) || "",
                              location:
                                (user?.unsafeMetadata?.location as string) ||
                                "",
                              website:
                                (user?.unsafeMetadata?.website as string) || "",
                            })
                          }}
                          disabled={isLoading}
                          style={{
                            padding: "6px 12px",
                            borderRadius: "6px",
                            background: "var(--bg-surface-hover)",
                            border: "1px solid var(--border-default)",
                            color: "var(--text-secondary)",
                            fontSize: "13px",
                            fontWeight: 500,
                            cursor: isLoading ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            transition: "all 0.15s",
                          }}
                        >
                          <X size={14} />
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: "14px",
                      color: "var(--text-muted)",
                      margin: "0 0 16px",
                    }}
                  >
                    Member since {formatDate(user?.createdAt)}
                  </p>
                </div>
              </div>
            </div>

            {/* Profile Fields */}
            <div
              style={{
                padding: "24px",
                display: "flex",
                flexDirection: "column",
                gap: "20px",
              }}
            >
              {/* Name Fields */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                  gap: "16px",
                }}
              >
                <div>
                  <label
                    htmlFor="firstName"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) =>
                      setFormData({ ...formData, firstName: e.target.value })
                    }
                    disabled={!isEditing || isLoading}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isEditing
                        ? "var(--bg-primary)"
                        : "var(--bg-surface)",
                      border: `1px solid ${isEditing ? "var(--border-default)" : "transparent"}`,
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.15s",
                    }}
                    onFocus={(e) => {
                      if (isEditing) {
                        e.currentTarget.style.borderColor = "var(--accent)"
                      }
                    }}
                    onBlur={(e) => {
                      if (isEditing) {
                        e.currentTarget.style.borderColor =
                          "var(--border-default)"
                      }
                    }}
                  />
                </div>
                <div>
                  <label
                    htmlFor="lastName"
                    style={{
                      display: "block",
                      fontSize: "13px",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: "6px",
                    }}
                  >
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) =>
                      setFormData({ ...formData, lastName: e.target.value })
                    }
                    disabled={!isEditing || isLoading}
                    style={{
                      width: "100%",
                      padding: "10px 14px",
                      borderRadius: "8px",
                      background: isEditing
                        ? "var(--bg-primary)"
                        : "var(--bg-surface)",
                      border: `1px solid ${isEditing ? "var(--border-default)" : "transparent"}`,
                      color: "var(--text-primary)",
                      fontSize: "14px",
                      outline: "none",
                      transition: "all 0.15s",
                    }}
                    onFocus={(e) => {
                      if (isEditing) {
                        e.currentTarget.style.borderColor = "var(--accent)"
                      }
                    }}
                    onBlur={(e) => {
                      if (isEditing) {
                        e.currentTarget.style.borderColor =
                          "var(--border-default)"
                      }
                    }}
                  />
                </div>
              </div>

              {/* Bio Field */}
              <div>
                <label
                  htmlFor="bio"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Bio{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    (Not persisted - backend integration required)
                  </span>
                </label>
                <textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) =>
                    setFormData({ ...formData, bio: e.target.value.slice(0, 500) })
                  }
                  onPaste={(e) => {
                    const pasted = e.clipboardData.getData("text")
                    if (pasted.length > 500) {
                      e.preventDefault()
                      const current = formData.bio
                      const remaining = 500 - current.length
                      if (remaining > 0) {
                        setFormData({ ...formData, bio: current + pasted.slice(0, remaining) })
                      }
                    }
                  }}
                  disabled
                  rows={3}
                  placeholder="Bio field is disabled - backend integration required"
                  maxLength={500}
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    outline: "none",
                    resize: "vertical",
                    lineHeight: 1.5,
                    transition: "all 0.15s",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                />
                <p
                  style={{
                    fontSize: "11px",
                    color: "var(--text-muted)",
                    marginTop: "4px",
                    margin: "4px 0 0",
                  }}
                >
                  {formData.bio.length}/500 characters
                </p>
              </div>

              {/* Location Field */}
              <div>
                <label
                  htmlFor="location"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Location{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    (Not persisted - backend integration required)
                  </span>
                </label>
                <input
                  id="location"
                  type="text"
                  value={formData.location}
                  onChange={(e) =>
                    setFormData({ ...formData, location: e.target.value })
                  }
                  disabled
                  placeholder="Location field is disabled"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                />
              </div>

              {/* Website Field */}
              <div>
                <label
                  htmlFor="website"
                  style={{
                    display: "block",
                    fontSize: "13px",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: "6px",
                  }}
                >
                  Website{" "}
                  <span
                    style={{
                      fontWeight: 400,
                      color: "var(--text-muted)",
                      fontSize: "12px",
                    }}
                  >
                    (Not persisted - backend integration required)
                  </span>
                </label>
                <input
                  id="website"
                  type="url"
                  value={formData.website}
                  onChange={(e) =>
                    setFormData({ ...formData, website: e.target.value })
                  }
                  disabled
                  placeholder="Website field is disabled"
                  style={{
                    width: "100%",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    background: "var(--bg-surface)",
                    border: "1px solid var(--border-default)",
                    color: "var(--text-muted)",
                    fontSize: "14px",
                    outline: "none",
                    transition: "all 0.15s",
                    cursor: "not-allowed",
                    opacity: 0.6,
                  }}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--border-default)"
                  }}
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Mail size={18} color="var(--accent)" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 2px",
                  }}
                >
                  Contact Information
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Your email addresses and contact details
                </p>
              </div>
            </div>

            <div style={{ padding: "0" }}>
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: "0 0 2px",
                    }}
                  >
                    Primary Email
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Used for login and notifications
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  {user?.primaryEmailAddress?.emailAddress || "Not set"}
                </span>
              </div>

              {user?.emailAddresses?.map((email) => {
                if (email.id === user.primaryEmailAddress?.id) return null
                return (
                  <div
                    key={email.id}
                    style={{
                      padding: "16px 24px",
                      borderBottom: "1px solid var(--border-default)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                    }}
                  >
                    <span
                      style={{
                        fontSize: "14px",
                        color: "var(--text-secondary)",
                      }}
                    >
                      {email.emailAddress}
                    </span>
                    <span
                      style={{
                        fontSize: "12px",
                        color: "var(--text-muted)",
                        textTransform: "uppercase",
                        fontWeight: 500,
                      }}
                    >
                      Secondary
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {activeTab === "preferences" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Notifications */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bell size={18} color="var(--accent)" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 2px",
                  }}
                >
                  Notifications
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Manage your notification preferences
                </p>
              </div>
            </div>

            <div style={{ padding: "0" }}>
              <div
                style={{
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: "0 0 2px",
                    }}
                  >
                    Email Notifications
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Receive updates about your notebooks
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    handlePreferenceChange(
                      "emailNotifications",
                      !preferences.emailNotifications
                    )
                  }
                  style={{
                    width: "44px",
                    height: "24px",
                    borderRadius: "12px",
                    background: preferences.emailNotifications
                      ? "var(--accent)"
                      : "var(--bg-surface)",
                    border: "none",
                    cursor: "pointer",
                    position: "relative",
                    transition: "all 0.15s",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: "2px",
                      left: preferences.emailNotifications ? "22px" : "2px",
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      background: "var(--primary-foreground)",
                      transition: "all 0.15s",
                    }}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Palette size={18} color="var(--accent)" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 2px",
                  }}
                >
                  Appearance
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Customize the look and feel
                </p>
              </div>
            </div>

            <div style={{ padding: "16px 24px" }}>
              <p
                style={{
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: "12px",
                }}
              >
                Theme Mode
              </p>
              <div style={{ display: "flex", gap: "8px" }}>
                {["light", "dark", "system"].map((mode) => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => handlePreferenceChange("darkMode", mode)}
                    style={{
                      flex: 1,
                      padding: "12px",
                      borderRadius: "8px",
                      background:
                        preferences.darkMode === mode
                          ? "var(--accent)"
                          : "var(--bg-surface)",
                      border: `1px solid ${preferences.darkMode === mode
                        ? "var(--accent)"
                        : "var(--border-default)"
                        }`,
                      color:
                        preferences.darkMode === mode
                          ? "var(--primary-foreground)"
                          : "var(--text-secondary)",
                      fontSize: "14px",
                      fontWeight: 500,
                      cursor: "pointer",
                      textTransform: "capitalize",
                      transition: "all 0.15s",
                    }}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data & Storage Tab */}
      {activeTab === "data" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Storage Overview */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              padding: "24px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "20px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Database size={18} color="var(--accent)" />
              </div>
              <h3
                style={{
                  fontSize: "15px",
                  fontWeight: 600,
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Storage Overview
              </h3>
            </div>

            <div style={{ marginBottom: "16px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "8px",
                }}
              >
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                  }}
                >
                  Storage Used
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    fontWeight: 500,
                    color: "var(--text-primary)",
                  }}
                >
                  45 MB / 100 MB
                </span>
              </div>
              <div
                style={{
                  height: "8px",
                  background: "var(--bg-surface)",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    height: "100%",
                    width: "45%",
                    background: "var(--accent)",
                    borderRadius: "4px",
                  }}
                />
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                gap: "16px",
                marginTop: "20px",
              }}
            >
              <div
                style={{
                  padding: "16px",
                  background: "var(--bg-primary)",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: "0 0 4px",
                  }}
                >
                  Notebooks
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  2
                </p>
              </div>
              <div
                style={{
                  padding: "16px",
                  background: "var(--bg-primary)",
                  borderRadius: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "12px",
                    color: "var(--text-muted)",
                    margin: "0 0 4px",
                  }}
                >
                  Documents
                </p>
                <p
                  style={{
                    fontSize: "24px",
                    fontWeight: 700,
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  12
                </p>
              </div>
            </div>
          </div>

          {/* Security */}
          <div
            style={{
              background: "var(--bg-secondary)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border-default)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-default)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
              }}
            >
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "8px",
                  background: "var(--accent-muted)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Shield size={18} color="var(--accent)" />
              </div>
              <div>
                <h3
                  style={{
                    fontSize: "15px",
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    margin: "0 0 2px",
                  }}
                >
                  Security
                </h3>
                <p
                  style={{
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    margin: 0,
                  }}
                >
                  Password and authentication settings
                </p>
              </div>
            </div>

            <div style={{ padding: "0" }}>
              <div
                style={{
                  padding: "16px 24px",
                  borderBottom: "1px solid var(--border-default)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: "0 0 2px",
                    }}
                  >
                    Two-Factor Authentication
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Add an extra layer of security
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                    padding: "4px 10px",
                    borderRadius: "4px",
                    background: "var(--bg-surface)",
                  }}
                >
                  Not Enabled
                </span>
              </div>

              <div
                style={{
                  padding: "16px 24px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "14px",
                      fontWeight: 500,
                      color: "var(--text-primary)",
                      margin: "0 0 2px",
                    }}
                  >
                    Active Sessions
                  </p>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "var(--text-muted)",
                      margin: 0,
                    }}
                  >
                    Manage your logged-in devices
                  </p>
                </div>
                <span
                  style={{
                    fontSize: "14px",
                    color: "var(--text-secondary)",
                    fontWeight: 500,
                  }}
                >
                  1 device
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notifications */}
      <div
        style={{
          position: "fixed",
          bottom: "clamp(16px, 2vw, 24px)",
          right: "clamp(16px, 2vw, 24px)",
          left: "clamp(16px, 2vw, 24px)",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          zIndex: 1000,
          maxWidth: "400px",
          marginLeft: "auto",
        }}
      >
        {toasts.map((toast) => (
          <div
            key={toast.id}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "10px",
              padding: "12px 16px",
              borderRadius: "8px",
              background:
                toast.type === "success"
                  ? "var(--success-muted)"
                  : toast.type === "error"
                    ? "var(--bg-destructive)"
                    : "var(--bg-surface)",
              border: `1px solid ${toast.type === "success"
                ? "var(--success)"
                : toast.type === "error"
                  ? "var(--destructive)"
                  : "var(--border-default)"
                }`,
              boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)",
              animation: "slideIn 0.2s ease",
              wordBreak: "break-word",
            }}
          >
            {toast.type === "success" ? (
              <CheckCircle
                size={18}
                color="var(--success)"
                style={{ flexShrink: 0 }}
              />
            ) : toast.type === "error" ? (
              <AlertCircle
                size={18}
                color="var(--destructive)"
                style={{ flexShrink: 0 }}
              />
            ) : (
              <AlertCircle
                size={18}
                color="var(--text-secondary)"
                style={{ flexShrink: 0 }}
              />
            )}
            <span
              style={{
                fontSize: "13px",
                color:
                  toast.type === "success"
                    ? "var(--success)"
                    : toast.type === "error"
                      ? "var(--destructive)"
                      : "var(--text-primary)",
                flex: 1,
              }}
            >
              {toast.message}
            </span>
          </div>
        ))}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  )
}
