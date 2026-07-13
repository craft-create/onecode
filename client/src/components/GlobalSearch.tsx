import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Clock, ArrowRight, Film, Clapperboard, User } from "lucide-react";
import { logger } from "@/compat/client-toolkit/logger";
import { globalSearch } from "@client/src/api/search";
import type { SearchResponse } from "@shared/search.interface";
import type { MaterialItem } from "@shared/material.interface";
import type { ScriptProjectItem } from "@shared/script.interface";
import type { TopCreator } from "@shared/home.interface";

const HISTORY_KEY = "global_search_history";
const MAX_HISTORY = 5;

interface SearchHistoryItem {
  keyword: string;
  timestamp: number;
}

function getHistory(): SearchHistoryItem[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed as SearchHistoryItem[];
  } catch {
    return [];
  }
}

function saveHistory(keyword: string): void {
  const history = getHistory();
  const filtered = history.filter(
    (item: SearchHistoryItem) => item.keyword !== keyword,
  );
  const updated = [{ keyword, timestamp: Date.now() }, ...filtered].slice(
    0,
    MAX_HISTORY,
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
}

function removeHistory(keyword: string): void {
  const history = getHistory().filter(
    (item: SearchHistoryItem) => item.keyword !== keyword,
  );
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

const GlobalSearch = () => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<SearchHistoryItem[]>(getHistory());
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const navigate = useNavigate();

  const performSearch = useCallback(async (keyword: string) => {
    if (!keyword.trim()) {
      setResults(null);
      return;
    }
    setLoading(true);
    try {
      const data = await globalSearch({ keyword: keyword.trim() });
      setResults(data);
    } catch (err: unknown) {
      logger.error("全局搜索失败:", err instanceof Error ? err.message : String(err));
      setResults(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    if (!open) return;
    debounceRef.current = setTimeout(() => {
      performSearch(query);
    }, 300);
    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, open, performSearch]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev: boolean) => !prev);
      }
      if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
    }
    if (!open) {
      setQuery("");
      setResults(null);
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const handleSelect = (path: string) => {
    saveHistory(query);
    setHistory(getHistory());
    setOpen(false);
    navigate(path);
  };

  const handleHistoryClick = (keyword: string) => {
    setQuery(keyword);
    performSearch(keyword);
  };

  const hasResults =
    results &&
    (results.materials.length > 0 ||
      results.scripts.length > 0 ||
      results.creators.length > 0);

  const showHistory = !query.trim() && history.length > 0;

  return (
    <div className="relative" ref={containerRef}>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-accent/50 border border-border/50 hover:border-border transition-all duration-200 min-w-[200px]"
      >
        <Search className="w-4 h-4 shrink-0" />
        <span className="flex-1 text-left">搜索素材、剧本、创作者...</span>
        <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-mono bg-accent text-muted-foreground border border-border">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm" />
          <div className="absolute right-0 top-full mt-2 w-[480px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2 px-4 py-3 border-b border-border">
              <Search className="w-4 h-4 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="搜索素材、剧本、创作者..."
                className="flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none"
              />
              {loading && (
                <div className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin shrink-0" />
              )}
            </div>

            <div className="max-h-[400px] overflow-y-auto">
              {showHistory && (
                <div className="p-2">
                  <div className="flex items-center justify-between px-2 py-1.5">
                    <span className="text-xs font-medium text-muted-foreground">
                      搜索历史
                    </span>
                  </div>
                  {history.map((item: SearchHistoryItem) => (
                    <div
                      key={item.keyword + item.timestamp}
                      className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent/50 cursor-pointer group"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span
                        className="flex-1 text-sm text-foreground truncate"
                        onClick={() => handleHistoryClick(item.keyword)}
                      >
                        {item.keyword}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeHistory(item.keyword);
                          setHistory(getHistory());
                        }}
                        className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-opacity text-xs"
                      >
                        删除
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {!query.trim() && !showHistory && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  输入关键词开始搜索
                </div>
              )}

              {query.trim() && !loading && !hasResults && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  未找到相关结果
                </div>
              )}

              {hasResults && (
                <div className="p-2 space-y-1">
                  {results.materials.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Film className="w-3.5 h-3.5" />
                          素材
                        </span>
                        {results.materials.length >= 5 && (
                          <button
                            onClick={() =>
                              handleSelect(
                                `/materials?keyword=${encodeURIComponent(query)}`,
                              )
                            }
                            className="text-xs text-primary hover:underline flex items-center gap-0.5"
                          >
                            查看全部 <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {results.materials.map((item: MaterialItem) => (
                        <div
                          key={item.id}
                          onClick={() => handleSelect(`/materials/${item.id}`)}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 cursor-pointer"
                        >
                          {item.cover_url ? (
                            <img
                              src={item.cover_url}
                              alt={item.title}
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-accent flex items-center justify-center shrink-0">
                              <Film className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.type === "video"
                                ? "视频"
                                : item.type === "audio"
                                  ? "音频"
                                  : "音效"}
                              {item.resolution && ` · ${item.resolution}`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.scripts.length > 0 && (
                    <div>
                      <div className="flex items-center justify-between px-2 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <Clapperboard className="w-3.5 h-3.5" />
                          剧本
                        </span>
                        {results.scripts.length >= 5 && (
                          <button
                            onClick={() =>
                              handleSelect(
                                `/scripts?keyword=${encodeURIComponent(query)}`,
                              )
                            }
                            className="text-xs text-primary hover:underline flex items-center gap-0.5"
                          >
                            查看全部 <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                      {results.scripts.map((item: ScriptProjectItem) => (
                        <div
                          key={item.id}
                          onClick={() =>
                            handleSelect(`/scripts/${item.id}`)
                          }
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 cursor-pointer"
                        >
                          {item.cover_url ? (
                            <img
                              src={item.cover_url}
                              alt={item.title}
                              className="w-10 h-10 rounded object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-10 h-10 rounded bg-accent flex items-center justify-center shrink-0">
                              <Clapperboard className="w-4 h-4 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {item.title}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {item.type || "剧本"}
                              {item.collaborator_count > 0 &&
                                ` · ${item.collaborator_count} 位协作者`}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {results.creators.length > 0 && (
                    <div>
                      <div className="px-2 py-1.5">
                        <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                          <User className="w-3.5 h-3.5" />
                          创作者
                        </span>
                      </div>
                      {results.creators.map((item: TopCreator) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/50 cursor-pointer"
                        >
                          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center shrink-0">
                            <User className="w-4 h-4 text-muted-foreground" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm text-foreground truncate">
                              {item.name || item.id}
                            </div>
                            <div className="text-xs text-muted-foreground truncate">
                              {item.representative_work
                                ? `代表作: ${item.representative_work}`
                                : "创作者"}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-4 py-2 border-t border-border flex items-center gap-4 text-[11px] text-muted-foreground">
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-accent border border-border text-[10px]">
                  ↑↓
                </kbd>
                {" 导航"}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-accent border border-border text-[10px]">
                  ↵
                </kbd>
                {" 选择"}
              </span>
              <span className="flex items-center gap-1">
                <kbd className="px-1 py-0.5 rounded bg-accent border border-border text-[10px]">
                  Esc
                </kbd>
                {" 关闭"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default GlobalSearch;
