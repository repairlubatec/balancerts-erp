export function paginateAuditReviewHistory<T>(items: T[], requestedPage: number, pageSize = 5) {
  const safePageSize = Math.min(Math.max(Math.trunc(pageSize), 1), 50);
  const pageCount = Math.max(1, Math.ceil(items.length / safePageSize));
  const page = Math.min(Math.max(Math.trunc(requestedPage) || 1, 1), pageCount);
  return {
    page,
    pageSize: safePageSize,
    pageCount,
    hasPrevious: page > 1,
    hasNext: page < pageCount,
    items: items.slice((page - 1) * safePageSize, page * safePageSize),
  };
}
