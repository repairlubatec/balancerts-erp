export type PgcAccountSort = "CODE_ASC" | "CODE_DESC" | "NAME_ASC" | "STATUS";

type SortablePgcAccount = {
  code: string;
  name: string;
  validationStatus: string;
};

export function sortPgcAccounts<T extends SortablePgcAccount>(accounts: T[], sort: PgcAccountSort) {
  return [...accounts].sort((left, right) => {
    if (sort === "NAME_ASC") return left.name.localeCompare(right.name, "pt-PT");
    if (sort === "STATUS") {
      return left.validationStatus.localeCompare(right.validationStatus) || left.code.localeCompare(right.code, "pt-PT", { numeric: true });
    }
    const comparison = left.code.localeCompare(right.code, "pt-PT", { numeric: true });
    return sort === "CODE_DESC" ? -comparison : comparison;
  });
}
