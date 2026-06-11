import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import { useToast } from "../ui/Toast";
import { useInventoryMutations } from "../../hooks/useInventory";

export default function GroupFormModal({ open, onClose }) {
  const toast = useToast();
  const { addGroup } = useInventoryMutations();

  const [name, setName] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) return;
    setName("");
    setError("");
  }, [open]);

  const submit = async () => {
    if (!name.trim()) {
      setError("Group name is required");
      return;
    }
    try {
      await addGroup.mutateAsync({ name });
      toast.success("Group added", name.trim());
      onClose();
    } catch (e) {
      toast.error("Could not add group", e.message);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="sm"
      title="Add material group"
      description="Groups organize raw materials, e.g. Metals, Packaging, Chemicals."
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={addGroup.isPending}>
            Cancel
          </Button>
          <Button onClick={submit} loading={addGroup.isPending}>
            Add group
          </Button>
        </>
      }
    >
      <Input
        label="Group name"
        required
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder="e.g. Packaging"
        error={error}
        autoFocus
      />
    </Modal>
  );
}
