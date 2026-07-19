import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  SlidersHorizontal,
  X,
  Play,
  Clock,
  Film,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { logger } from '@/utils/logger';
import { Image } from '@client/src/components/ui/image';
import {
  listMaterials,
  searchMaterials,
  getMaterialFilters,
} from '@client/src/api/materials';
import MaterialFilterPanel from './MaterialFilterPanel';
import type { MaterialItem, MaterialFiltersResponse } from '@shared/material.interface';
import { PageFrame } from '../shared/PageShell';

const PAGE_SIZE = 20;

const MaterialsPage: React.FC = () => {
  const navigate = useNavigate();
  const [materials, setMaterials] = useState<MaterialItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [activeType, setActiveType] = useState('');
  const [selectedResolutions, setSelectedResolutions] = useState<string[]>(
    [],
  );
  const [selectedDuration, setSelectedDuration] = useState<{
    min: number;
    max: number;
  } | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [filters, setFilters] = useState<MaterialFiltersResponse | null>(
    null,
  );
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<
    { id: string; title: string; cover_url: string }[]
  >([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);

  const fetchMaterials = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const result = await listMaterials({
        type: activeType || undefined,
        resolution:
          selectedResolutions.length > 0
            ? selectedResolutions.join(',')
            : undefined,
        durationMin: selectedDuration?.min,
        durationMax: selectedDuration?.max,
        tags: selectedTags.length > 0 ? selectedTags : undefined,
        page,
        pageSize: PAGE_SIZE,
      });
      setMaterials(result.items);
      setTotal(result.total);
    } catch (err: unknown) {
      logger.error('获取素材列表失败:', err);
      setError('加载素材列表失败，请检查网络后重试');
    } finally {
      setLoading(false);
    }
  }, [activeType, selectedResolutions, selectedDuration, selectedTags, page]);

  useEffect(() => {
    fetchMaterials();
  }, [fetchMaterials]);

  useEffect(() => {
    getMaterialFilters()
      .then(setFilters)
      .catch((err: unknown) => logger.error('获取筛选选项失败:', err));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(e.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () =>
      document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchInput = (value: string) => {
    setSearchKeyword(value);
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
    if (!value.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    searchTimerRef.current = setTimeout(async () => {
      try {
        const result = await searchMaterials({
          keyword: value.trim(),
          page: 1,
          pageSize: 5,
        });
        setSearchSuggestions(result.items);
        setShowSuggestions(true);
      } catch (err: unknown) {
        logger.error('搜索建议失败:', err);
      }
    }, 300);
  };

  const handleSearchSubmit = () => {
    if (!searchKeyword.trim()) return;
    setShowSuggestions(false);
    setLoading(true);
    searchMaterials({
      keyword: searchKeyword.trim(),
      page: 1,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        setMaterials(
          result.items.map(
            (item): MaterialItem => ({
              id: item.id,
              title: item.title,
              type: item.type,
              resolution: item.resolution,
              duration: item.duration,
              cover_url: item.cover_url,
              preview_url: item.preview_url,
              tags: item.tags,
            }),
          ),
        );
        setTotal(result.total);
      })
      .catch((err: unknown) => logger.error('搜索失败:', err))
      .finally(() => setLoading(false));
  };

  const handleTypeChange = (type: string) => {
    setActiveType(type);
    setPage(1);
  };

  const toggleResolution = (res: string) => {
    setSelectedResolutions((prev) =>
      prev.includes(res) ? prev.filter((r) => r !== res) : [...prev, res],
    );
    setPage(1);
  };

  const toggleDuration = (d: { min: number; max: number }) => {
    if (d.min === 0 && d.max === 0) {
      setSelectedDuration(null);
    } else {
      setSelectedDuration(d);
    }
    setPage(1);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
    setPage(1);
  };

  const clearFilters = () => {
    setActiveType('');
    setSelectedResolutions([]);
    setSelectedDuration(null);
    setSelectedTags([]);
    setSearchKeyword('');
    setPage(1);
  };

  const hasActiveFilters =
    activeType ||
    selectedResolutions.length > 0 ||
    selectedDuration ||
    selectedTags.length > 0;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}秒`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}分${secs}秒` : `${mins}分钟`;
  };

  const typeLabel = (t: string): string => {
    if (t === 'video') return '视频';
    if (t === 'audio') return '音频';
    if (t === 'sound') return '音效';
    return t;
  };

  return (
    <PageFrame className="min-h-screen bg-background" containerClassName="app-container-shell" contentClassName="">
      {/* Search Bar */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-border">
        <div className="app-shell py-3 flex items-center gap-3">
          <div ref={searchRef} className="relative flex-1 max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={searchKeyword}
              onChange={(e) => handleSearchInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchSubmit()}
              onFocus={() =>
                searchSuggestions.length > 0 && setShowSuggestions(true)
              }
              placeholder="搜索素材..."
              className="w-full h-10 pl-10 pr-4 rounded-lg bg-card border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
            />
            {searchKeyword && (
              <button
                onClick={() => {
                  setSearchKeyword('');
                  setSearchSuggestions([]);
                  setShowSuggestions(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <AnimatePresence>
              {showSuggestions && searchSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  className="absolute top-full mt-1 w-full bg-card border border-border rounded-lg shadow-lg overflow-hidden z-40"
                >
                  {searchSuggestions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => {
                        setSearchKeyword(s.title);
                        setShowSuggestions(false);
                        handleSearchSubmit();
                      }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-accent transition-colors text-left"
                    >
                      <div className="w-10 h-7 rounded bg-accent overflow-hidden flex-shrink-0">
                        {s.cover_url ? (
                          <Image
                            src={s.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-accent" />
                        )}
                      </div>
                      <span className="text-sm text-foreground truncate">
                        {s.title}
                      </span>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-all ${
              showFilters || hasActiveFilters
                ? 'border-primary text-primary bg-primary/10'
                : 'border-border text-muted-foreground hover:text-foreground hover:border-foreground/30'
            }`}
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span className="text-sm hidden sm:inline">筛选</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </button>
        </div>
      </div>

      <div className="app-shell py-6 flex gap-6">
        {/* Filter Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              className="flex-shrink-0 overflow-hidden"
            >
              <MaterialFilterPanel
                filters={filters}
                activeType={activeType}
                selectedResolutions={selectedResolutions}
                selectedDuration={selectedDuration}
                selectedTags={selectedTags}
                onTypeChange={handleTypeChange}
                onToggleResolution={toggleResolution}
                onToggleDuration={toggleDuration}
                onToggleTag={toggleTag}
                onClear={clearFilters}
              />
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          {/* Active filters chips */}
          {hasActiveFilters && (
            <div className="flex flex-wrap items-center gap-2 mb-4">
              {activeType && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs">
                  {typeLabel(activeType)}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setActiveType('')}
                  />
                </span>
              )}
              {selectedResolutions.map((r: string) => (
                <span
                  key={r}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs"
                >
                  {r}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleResolution(r)}
                  />
                </span>
              ))}
              {selectedDuration && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs">
                  {
                    filters?.durations.find(
                      (d) =>
                        d.min === selectedDuration.min &&
                        d.max === selectedDuration.max,
                    )?.label
                  }
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => setSelectedDuration(null)}
                  />
                </span>
              )}
              {selectedTags.map((t: string) => (
                <span
                  key={t}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/20 text-primary text-xs"
                >
                  {t}
                  <X
                    className="w-3 h-3 cursor-pointer"
                    onClick={() => toggleTag(t)}
                  />
                </span>
              ))}
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6 text-center">
              <AlertTriangle className="w-10 h-10 text-destructive mx-auto mb-3" />
              <p className="text-foreground text-sm mb-4">{error}</p>
              <button
                onClick={fetchMaterials}
                className="app-btn-primary"
              >
                <RefreshCw className="w-4 h-4" />
                重试
              </button>
            </div>
          )}

          {/* Loading */}
          {loading && !error && (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && materials.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
              <Film className="w-16 h-16 mb-4 opacity-30" />
              <p className="text-lg font-medium mb-1">
                {searchKeyword.trim() ? '未找到相关素材' : '暂无素材'}
              </p>
              <p className="text-sm">
                {hasActiveFilters
                  ? '尝试调整筛选条件'
                  : searchKeyword.trim()
                    ? '请尝试其他关键词'
                    : '素材库中还没有内容'}
              </p>
            </div>
          )}

          {/* Material Grid */}
          {!loading && !error && materials.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {materials.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: '-40px' }}
                    transition={{
                      duration: 0.4,
                      delay: (index % 8) * 0.05,
                      ease: [0.25, 0.46, 0.45, 0.94],
                    }}
                    whileHover={{ scale: 1.03 }}
                    onClick={() => navigate(`/materials/${item.id}`)}
                    className="group cursor-pointer rounded-lg overflow-hidden bg-card border border-border hover:border-primary/30 transition-colors"
                  >
                    <div className="relative aspect-video bg-accent overflow-hidden">
                      {item.cover_url ? (
                        <Image
                          src={item.cover_url}
                          alt={item.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Play className="w-8 h-8 text-muted-foreground/40" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                        <Play className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 rounded text-[10px] font-medium bg-black/60 text-white backdrop-blur-sm">
                        {typeLabel(item.type)}
                      </span>
                      {item.duration > 0 && (
                        <span className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded text-[10px] bg-black/60 text-white backdrop-blur-sm flex items-center gap-1">
                          <Clock className="w-2.5 h-2.5" />
                          {formatDuration(item.duration)}
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <h3 className="text-sm font-medium text-foreground truncate group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1.5">
                        {item.resolution && (
                          <span className="text-[11px] text-muted-foreground">
                            {item.resolution}
                          </span>
                        )}
                        {item.tags && item.tags.length > 0 && (
                          <span className="text-[11px] text-muted-foreground truncate">
                            {item.tags.slice(0, 2).join(' · ')}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    上一页
                  </button>
                  {Array.from(
                    { length: Math.min(totalPages, 7) },
                    (_, i) => {
                      const p =
                        totalPages <= 7
                          ? i + 1
                          : page <= 4
                            ? i + 1
                            : page >= totalPages - 3
                              ? totalPages - 6 + i
                              : page - 3 + i;
                      return (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`w-9 h-9 rounded-lg text-sm transition-all ${
                            p === page
                              ? 'bg-primary text-primary-foreground'
                              : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                          }`}
                        >
                          {p}
                        </button>
                      );
                    },
                  )}
                  <button
                    onClick={() =>
                      setPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={page === totalPages}
                    className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  >
                    下一页
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </PageFrame>
  );
};

export default MaterialsPage;
