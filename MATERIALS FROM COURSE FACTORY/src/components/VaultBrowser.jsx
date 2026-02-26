import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileText,
  Folder,
  Package,
  Search,
  X,
} from 'lucide-react';
import vaultIndex from '../data/vault.json';

/**
 * VAULT BROWSER (Neo-Brutalist Design)
 * Reads from local vault.json to allow selecting offline assets.
 *
 * Supports folder navigation based on each entry's `path`.
 */
const VaultBrowser = ({ onSelect, onClose, mode = 'file' }) => {
  const [search, setSearch] = useState('');
  const [cwd, setCwd] = useState([]); // path segments under /materials/

  const files = vaultIndex?.files || [];

  const normalizePath = (value) => String(value || '').replace(/\\/g, '/');
  const getMaterialsRelativePath = (value) => {
    const clean = normalizePath(value).replace(/^\/+/, '');
    const idx = clean.toLowerCase().indexOf('materials/');
    if (idx !== -1) return clean.slice(idx + 'materials/'.length);
    return clean;
  };

  const indexedFiles = useMemo(() => {
    return files.map((file) => {
      const relPath = getMaterialsRelativePath(file.path || file.filename || '');
      const segments = relPath.split('/').filter(Boolean);
      const folderSegments = segments.slice(0, Math.max(0, segments.length - 1));
      return {
        ...file,
        __relPath: relPath,
        __folderSegments: folderSegments,
      };
    });
  }, [files]);

  const filtered = useMemo(() => {
    const q = String(search || '').trim().toLowerCase();
    if (!q) return indexedFiles;
    return indexedFiles.filter((f) => {
      const title = String(f.title || '').toLowerCase();
      const filename = String(f.filename || '').toLowerCase();
      const relPath = String(f.__relPath || '').toLowerCase();
      return title.includes(q) || filename.includes(q) || relPath.includes(q);
    });
  }, [indexedFiles, search]);

  const cwdKey = cwd.join('/');

  const folderView = useMemo(() => {
    const q = String(search || '').trim();
    if (q) {
      return { folders: [], files: filtered };
    }

    const foldersSet = new Set();
    const cwdLen = cwd.length;

    filtered.forEach((f) => {
      const segs = f.__folderSegments || [];
      const isInCwd = cwdLen === 0 || segs.slice(0, cwdLen).join('/') === cwdKey;
      if (!isInCwd) return;

      if (segs.length > cwdLen) {
        foldersSet.add(segs[cwdLen]);
      }
    });

    const folders = Array.from(foldersSet).sort((a, b) => String(a).localeCompare(String(b)));
    const filesInFolder = filtered
      .filter((f) => {
        const segs = f.__folderSegments || [];
        return (cwdLen === 0 || segs.slice(0, cwdLen).join('/') === cwdKey) && segs.length === cwdLen;
      })
      .sort((a, b) => String(a.__relPath || '').localeCompare(String(b.__relPath || '')));

    return { folders, files: filesInFolder };
  }, [cwd, cwdKey, filtered, search]);

  const breadcrumbs = useMemo(() => {
    return [{ label: 'materials', path: [] }].concat(
      cwd.map((seg, idx) => ({ label: seg, path: cwd.slice(0, idx + 1) })),
    );
  }, [cwd]);

  const openFolder = (folderName) => setCwd((prev) => prev.concat([folderName]));
  const goUp = () => setCwd((prev) => prev.slice(0, Math.max(0, prev.length - 1)));
  const goToCrumb = (pathSegments) => setCwd(Array.isArray(pathSegments) ? pathSegments : []);

  const isSearchActive = String(search || '').trim().length > 0;
  const allowFolderSelect = mode === 'folder';

  return (
    <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white text-black border-4 border-black w-full max-w-2xl max-h-[80vh] flex flex-col shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] animate-in fade-in zoom-in duration-200">
        <div className="bg-yellow-400 border-b-4 border-black p-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-black text-white p-1">
              <Package size={24} />
            </div>
            <h2 className="font-black text-xl uppercase tracking-tighter">Asset Vault</h2>
          </div>
          <button
            onClick={onClose}
            className="hover:bg-red-500 hover:text-white p-2 border-2 border-transparent hover:border-black transition-all"
            type="button"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-4 border-b-4 border-black bg-gray-50">
          <div className="flex items-center justify-between gap-3 mb-3">
            <div className="flex items-center gap-1 text-xs font-mono flex-wrap">
              {breadcrumbs.map((crumb, idx) => (
                <React.Fragment key={`crumb-${idx}-${crumb.label}`}>
                  {idx > 0 && <ChevronRight size={14} className="text-gray-500" />}
                  <button
                    type="button"
                    onClick={() => goToCrumb(crumb.path)}
                    className="inline-flex items-center gap-1 px-1.5 py-0.5 border-2 border-black bg-white hover:bg-yellow-200 transition-colors"
                    title={crumb.label}
                  >
                    <span className="font-bold">{crumb.label}</span>
                  </button>
                </React.Fragment>
              ))}
            </div>
            <button
              type="button"
              onClick={goUp}
              disabled={cwd.length === 0 || isSearchActive}
              className="inline-flex items-center gap-1 px-2 py-1 border-2 border-black bg-white hover:bg-yellow-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors text-xs font-black uppercase"
              title={isSearchActive ? 'Clear search to browse folders' : 'Up one folder'}
            >
              <ChevronLeft size={16} />
              Up
            </button>
          </div>

          {allowFolderSelect && !isSearchActive && (
            <button
              type="button"
              onClick={() => onSelect({ kind: 'vault-folder', segments: cwd })}
              className="w-full mb-3 px-3 py-2 border-2 border-black bg-white hover:bg-yellow-200 transition-colors text-xs font-black uppercase tracking-wide"
              title="Select the current folder"
            >
              Use This Folder: /materials/{cwd.join('/') || ''}
            </button>
          )}

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-500" size={20} />
            <input
              type="text"
              placeholder="SEARCH LOCAL ASSETS..."
              className="w-full bg-white border-2 border-black p-2 pl-10 font-bold focus:outline-none focus:ring-4 focus:ring-yellow-400/50 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        </div>

        <div className="overflow-y-auto p-4 space-y-2 flex-1 bg-white">
          {!isSearchActive &&
            folderView.folders.map((folderName) => (
              <button
                key={`folder-${cwdKey}-${folderName}`}
                type="button"
                onClick={() => openFolder(folderName)}
                className="w-full text-left group flex items-center justify-between p-3 border-2 border-black hover:bg-yellow-200 cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
                title={`Open folder: ${folderName}`}
              >
                <div className="flex items-center gap-3">
                  <Folder size={20} className="group-hover:scale-110 transition-transform" />
                  <div>
                    <div className="font-black leading-tight uppercase">{folderName}</div>
                    <div className="text-xs opacity-60 font-mono mt-0.5 group-hover:opacity-90">Folder</div>
                  </div>
                </div>
                <div className="font-black text-sm uppercase tracking-widest bg-white text-black px-2 py-0.5 border border-black">
                  OPEN
                </div>
              </button>
            ))}

          {folderView.files.map((file) => (
            <div
              key={file.id}
              onClick={() => onSelect({ kind: 'vault-file', file })}
              className="group flex items-center justify-between p-3 border-2 border-black hover:bg-blue-600 hover:text-white cursor-pointer transition-all hover:translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]"
              title={file.__relPath || file.filename}
            >
              <div className="flex items-center gap-3">
                <FileText size={20} className="group-hover:scale-110 transition-transform" />
                <div>
                  <div className="font-bold leading-tight">{file.title}</div>
                  <div className="text-xs opacity-60 font-mono mt-0.5 group-hover:opacity-90">
                    {(file.__relPath || file.filename) + ' - ' + (file.size || '')}
                  </div>
                </div>
              </div>
              <div className="opacity-0 group-hover:opacity-100 font-black text-sm uppercase tracking-widest bg-white text-black px-2 py-0.5 border border-black">
                SELECT
              </div>
            </div>
          ))}

          {folderView.folders.length === 0 && folderView.files.length === 0 && (
            <div className="text-center p-12 text-gray-400 font-mono border-2 border-dashed border-gray-300 flex flex-col items-center gap-2">
              <AlertCircle size={32} />
              <div>
                NO ASSETS FOUND
                <div className="text-xs mt-1">
                  Run <span className="bg-gray-200 px-1 text-black">SCAN_VAULT.bat</span> to update index
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-2 bg-gray-100 border-t-4 border-black text-xs font-mono text-center flex justify-between px-4">
          <span>UPDATED: {vaultIndex.lastUpdated ? vaultIndex.lastUpdated.split('T')[0] : 'NEVER'}</span>
          <span>{vaultIndex.count || 0} ITEMS</span>
        </div>
      </div>
    </div>
  );
};

export default VaultBrowser;

