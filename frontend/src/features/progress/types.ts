// Same shape as the backend's ProjectProgress (services/progress.ts)
export type ProgressCount = {
  done: number;
  inProgress: number; // shown for information, not counted in percent
  total: number;
  percent: number;
};

export type CategoryProgress = ProgressCount & {
  key: string; // item type key, the label comes from the template
};

export type Progress = ProgressCount & {
  categories: CategoryProgress[];
};
