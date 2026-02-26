import * as React from 'react';
import {
  CURRENT_PROJECT_SCHEMA_VERSION,
  getProjectSchemaVersion,
  migrateProjectData,
} from '../utils/migrations.js';

const { useEffect, useState } = React;

export function useProjectPersistence({
  projectData,
  setProjectData,
  showToast,
  storageKey = 'course_factory_v2_data',
} = {}) {
  const [isAutoLoaded, setIsAutoLoaded] = useState(false);
  const [lastSaved, setLastSaved] = useState(null);

  // AUTO-LOAD: Runs once on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Safety check: ensure it has the correct structure
        if (parsed && parsed['Current Course']) {
          const fromVersion = getProjectSchemaVersion(parsed);
          const migrated = migrateProjectData(parsed);
          if (migrated) {
            setProjectData(migrated);
            const toVersion = getProjectSchemaVersion(migrated);
            if (toVersion > fromVersion) {
              showToast(`Project schema upgraded to v${toVersion}`, 'success');
            }
          } else {
            setProjectData(parsed);
          }
          showToast('Project restored from storage', 'success');
        }
      }
      setIsAutoLoaded(true); // Allow saving to start
    } catch (error) {
      showToast('Failed to load project data. Starting fresh.', 'error');
      console.error('Load failed:', error);
      setIsAutoLoaded(true);
    }
  }, []);

  // AUTO-SAVE: Runs when projectData changes
  useEffect(() => {
    if (!isAutoLoaded) return; // Safety Lock: Don't save empty defaults

    const timer = setTimeout(() => {
      try {
        const dataToPersist =
          migrateProjectData(projectData, { targetVersion: CURRENT_PROJECT_SCHEMA_VERSION }) ||
          projectData;
        const dataSize = JSON.stringify(dataToPersist).length;
        const sizeMB = (dataSize / 1024 / 1024).toFixed(2);

        // Warn if approaching storage limit (4MB warning threshold)
        if (dataSize > 4 * 1024 * 1024) {
          showToast(`Warning: Project is ${sizeMB}MB. Approaching storage limit.`, 'warning', 6000);
        }

        localStorage.setItem(storageKey, JSON.stringify(dataToPersist));
        setLastSaved(new Date());
      } catch (error) {
        if (error.name === 'QuotaExceededError') {
          showToast('Storage full! Project too large. Please export backup immediately.', 'error', 10000);
        } else {
          showToast('Failed to save project. Check console for details.', 'error');
        }
        console.error('Save failed:', error);
      }
    }, 1000); // 1-second debounce

    return () => clearTimeout(timer);
  }, [projectData, isAutoLoaded, showToast, storageKey]);

  return { isAutoLoaded, lastSaved };
}
