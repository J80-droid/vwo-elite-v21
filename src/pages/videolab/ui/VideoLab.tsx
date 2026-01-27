/* eslint-disable @typescript-eslint/no-empty-object-type */
/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  generateEducationalImage,
  generateVeoVideo,
} from "@shared/api/gemini/media";
import {
  useDeleteGeneratedMedia,
  useGeneratedMedia,
  useSaveGeneratedMedia,
} from "@shared/hooks/useLocalData";
import { useTranslations } from "@shared/hooks/useTranslations";
import React, { useRef, useState } from "react";

export interface VideoLabProps {}

export const VideoLab: React.FC<VideoLabProps> = () => {
  const { t } = useTranslations();
  const [veoPrompt, setVeoPrompt] = useState("");
  const [veoImage, setVeoImage] = useState<string | null>(null);
  const [veoVideoUrl, setVeoVideoUrl] = useState<string | null>(null);
  const [isVeoLoading, setIsVeoLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Simple Image Gen Helper inside Video Lab for static diagrams
  const [imgPrompt, setImgPrompt] = useState("");
  const [genImg, setGenImg] = useState<string | null>(null);
  const [isImgLoading, setIsImgLoading] = useState(false);

  const veoFileInputRef = useRef<HTMLInputElement>(null);

  // SQLite Hooks
  const { data: library = [] } = useGeneratedMedia();
  const saveMediaMutation = useSaveGeneratedMedia();
  const deleteMediaMutation = useDeleteGeneratedMedia();

  const handleSaveMedia = async (
    type: "video" | "image",
    data: string,
    prompt: string,
  ) => {
    try {
      await saveMediaMutation.mutateAsync({
        id: crypto.randomUUID(),
        type,
        data,
        prompt,
        createdAt: Date.now(),
      });
    } catch (e) {
      console.error("Failed to save media", e);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteMediaMutation.mutateAsync(id);
    } catch (e) {
      console.error("Failed to delete media", e);
    }
  };

  const handleGenVideo = async () => {
    if (!veoPrompt) return;
    setIsVeoLoading(true);
    setError(null);
    try {
      const imageBase64 = veoImage ? veoImage.split(",")[1] : undefined;
      const url = await generateVeoVideo(veoPrompt, imageBase64, "16:9");
      if (!url)
        throw new Error(
          "Could not generate video. Check prompts or API key permissions.",
        );
      setVeoVideoUrl(url);

      // Auto-save generated video URL (Note: Veo URLs expire, ideally we'd download the blob, but for now saving URL)
      // Actually, Veo URL is remote. Persisting it is fine for short term.
      // BETTER: Since we can't easily download the remote stream without CORS, we just save the URL.
      handleSaveMedia("video", url, veoPrompt);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Video generation failed.");
    } finally {
      setIsVeoLoading(false);
    }
  };

  const handleVeoImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onloadend = () => setVeoImage(reader.result as string);
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleGenImage = async () => {
    setIsImgLoading(true);
    setError(null);
    try {
      const res = await generateEducationalImage(imgPrompt, "1K");
      if (!res) throw new Error("Could not generate image.");
      setGenImg(res);
      handleSaveMedia("image", res, imgPrompt);
    } catch (e: any) {
      console.error(e);
      setError(e.message || "Image generation failed.");
    } finally {
      setIsImgLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Veo Section */}
      <div className="bg-obsidian-900 p-6 rounded-xl border border-obsidian-800">
        {/* ... existing Veo controls ... */}
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polygon points="23 7 16 12 23 17 23 7" />
            <rect width="15" height="14" x="1" y="5" rx="2" ry="2" />
          </svg>
          {(t as any).VideoLab?.vid_title || "Video Lab"}
        </h3>
        <p className="text-slate-400 text-sm mb-4">
          {(t as any).VideoLab?.vid_desc ||
            "Genereer educatieve video's en diagrammen"}
        </p>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/50 text-rose-400 px-4 py-3 rounded-lg mb-4 text-sm flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <line x1="12" x2="12" y1="8" y2="12" />
              <line x1="12" x2="12.01" y1="16" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="flex flex-col gap-4 mb-6">
          {veoImage && (
            <div className="w-32 h-20 relative">
              <img
                src={veoImage}
                className="w-full h-full object-cover rounded border border-slate-600"
              />
              <button
                onClick={() => setVeoImage(null)}
                className="absolute -top-2 -right-2 bg-rose-500 rounded-full p-1 text-white"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>
            </div>
          )}
          <div className="flex gap-4">
            <input
              value={veoPrompt}
              onChange={(e) => setVeoPrompt(e.target.value)}
              placeholder={
                (t as any).VideoLab?.prompt || "Beschrijf de video..."
              }
              className="flex-1 bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 text-white outline-none focus:border-electric"
            />
            <input
              type="file"
              ref={veoFileInputRef}
              onChange={handleVeoImageSelect}
              accept="image/*"
              className="hidden"
            />
            <button
              onClick={() => veoFileInputRef.current?.click()}
              className="bg-obsidian-950 border border-obsidian-800 hover:border-white text-slate-300 px-4 rounded-lg flex items-center gap-2"
              title="Upload image to animate"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="9" r="2" />
                <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
              </svg>
            </button>
            <button
              onClick={handleGenVideo}
              disabled={isVeoLoading}
              className="bg-electric hover:bg-electric-glow text-white px-6 rounded-lg font-bold disabled:opacity-50"
            >
              {isVeoLoading ? "Generating..." : "Generate"}
            </button>
          </div>
        </div>

        {veoVideoUrl && (
          <video
            controls
            className="w-full rounded-lg border border-obsidian-800"
            src={veoVideoUrl}
          />
        )}
      </div>

      {/* Image Gen Section */}
      <div className="bg-obsidian-900 p-6 rounded-xl border border-obsidian-800">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
            <circle cx="9" cy="9" r="2" />
            <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
          </svg>
          {(t as any).VideoLab?.img_title || "Diagram Generator"}
        </h3>
        <div className="flex gap-4 mb-6">
          <input
            value={imgPrompt}
            onChange={(e) => setImgPrompt(e.target.value)}
            placeholder={
              (t as any).VideoLab?.img_prompt || "Prompt voor diagram..."
            }
            className="flex-1 bg-obsidian-950 border border-obsidian-800 rounded-lg p-3 text-white outline-none focus:border-electric"
          />
          <button
            onClick={handleGenImage}
            disabled={isImgLoading}
            className="bg-electric hover:bg-electric-glow text-white px-6 rounded-lg font-bold disabled:opacity-50"
          >
            {isImgLoading ? "Generating..." : "Generate"}
          </button>
        </div>

        {genImg && (
          <img
            src={genImg}
            alt="Generated diagram"
            className="w-full rounded-lg border border-obsidian-800"
          />
        )}
      </div>

      {/* Library / Gallery Section */}
      {library.length > 0 && (
        <div className="bg-obsidian-900 p-6 rounded-xl border border-obsidian-800">
          <h3 className="text-xl font-bold mb-4 text-white">
            Jouw Bibliotheek
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {library.map((item) => (
              <div
                key={item.id}
                className="relative group bg-obsidian-950 rounded-lg overflow-hidden border border-white/10"
              >
                {item.type === "video" ? (
                  <video src={item.data} className="w-full h-32 object-cover" />
                ) : (
                  <img src={item.data} className="w-full h-32 object-cover" />
                )}
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-2">
                  <p className="text-white text-xs line-clamp-2 text-center mb-2">
                    {item.prompt}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        item.type === "video"
                          ? setVeoVideoUrl(item.data)
                          : setGenImg(item.data)
                      }
                      className="bg-electric text-white p-1.5 rounded hover:bg-electric-glow"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="bg-rose-500 text-white p-1.5 rounded hover:bg-rose-600"
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      >
                        <polyline points="3 6 5 6 21 6" />
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      </svg>
                    </button>
                  </div>
                </div>
                <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/70 rounded text-[10px] text-white uppercase font-bold">
                  {item.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
