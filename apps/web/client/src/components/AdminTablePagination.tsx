type AdminTablePaginationProps = {
  currentPage: number;
  totalItems: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

function AdminTablePagination({
  currentPage,
  totalItems,
  pageSize,
  onPageChange,
}: AdminTablePaginationProps) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const safePage = Math.min(Math.max(currentPage, 1), totalPages);
  const start = totalItems === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const end = totalItems === 0 ? 0 : Math.min(safePage * pageSize, totalItems);

  return (
    <div className="admin-pagination">
      <p>
        Showing {start}-{end} of {totalItems}
      </p>
      <div className="admin-pagination-controls">
        <button
          className="admin-pagination-btn"
          onClick={() => onPageChange(safePage - 1)}
          disabled={safePage <= 1}
        >
          Previous
        </button>
        <span>Page {safePage} of {totalPages}</span>
        <button
          className="admin-pagination-btn"
          onClick={() => onPageChange(safePage + 1)}
          disabled={safePage >= totalPages}
        >
          Next
        </button>
      </div>
    </div>
  );
}

export default AdminTablePagination;
