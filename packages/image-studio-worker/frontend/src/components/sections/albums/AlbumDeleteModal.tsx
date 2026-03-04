import { Button, Modal } from "@/components/ui";
import type { Album } from "./albumTypes";

interface AlbumDeleteModalProps {
  deleteTarget: Album | null;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function AlbumDeleteModal({
  deleteTarget,
  deleting,
  onClose,
  onConfirm,
}: AlbumDeleteModalProps) {
  return (
    <Modal open={!!deleteTarget} onClose={onClose} title="Delete Album">
      <p className="text-gray-300">
        Delete <strong className="text-white">{deleteTarget?.name}</strong>? This cannot be undone.
      </p>
      <div className="flex gap-3 mt-6 justify-end">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="danger" onClick={onConfirm} loading={deleting}>
          Delete
        </Button>
      </div>
    </Modal>
  );
}
