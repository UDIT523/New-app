import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useToast } from "../ui/Toast";
import { useInventoryMutations } from "../../hooks/useInventory";

/** Add a new item, or edit an existing one when `editItem` is provided. */
export default function ItemFormModal({
  open,
  onClose,
  groups,
  defaultGroupId,
  editItem,
}) {
  const isEdit = Boolean(editItem);
  const toast = useToast();
  const { addItem, editItem: edit } = useInventoryMutations();

  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [reorder, setReorder] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;
    setErrors({});
    if (editItem) {
      setGroupId(editItem.groupId);
      setName(editItem.name);
      setUnit(editItem.unit || "");
      setReorder(String(editItem.reorder));
    } else {
      setGroupId(defaultGroupId || groups[0]?.id || "");
      setName("");
      setUnit("");
      setReorder("");
    }
  }, [open, editItem, defaultGroupId, groups]);

  const validate = () => {
    const next = {};
    if (!groupId) next.groupId = "Required";
    if (!name.trim()) next.name = "Required";
    if (!unit.trim()) next.unit = "Required";
    if (reorder === "" || Number(reorder) < 0 || Number.isNaN(Number(reorder)))
      next.reorder = "Enter a valid level";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const submit = async () => {
    if (!validate()) return;
    try {
      if (isEdit) {
        await edit.mutateAsync({
          itemId: editItem.id,
          name,
          unit,
          reorder: Number(reorder),
        });
        toast.success("Item updated", name.trim());
      } else {
        await addItem.mutateAsync({
          groupId,
          name,
          unit,
          reorder: Number(reorder),
        });
        toast.success("Item added", name.trim());
      }
      onClose();
    } catch (e) {
      toast.error("Could not save item", e.message);
    }
  };

  const saving = addItem.isPending || edit.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? "Edit item" : "Add item"}
      description={
        isEdit
          ? "Update the item's unit or reorder threshold."
          : "Stock drops below the reorder level are flagged in red."
      }
      footer={
        <>
          <Button variant="secondary" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={submit} loading={saving}>
            {isEdit ? "Save changes" : "Add item"}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2">
          <Select
            label="Group"
            required
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            disabled={isEdit}
            error={errors.groupId}
          >
            <option value="">Select a group…</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </Select>
        </div>
        <div className="sm:col-span-2">
          <Input
            label="Item name"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Caustic Soda"
            error={errors.name}
          />
        </div>
        <Input
          label="Unit"
          required
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="Kg, L, Nos…"
          error={errors.unit}
        />
        <Input
          label="Reorder level"
          type="number"
          min="0"
          required
          value={reorder}
          onChange={(e) => setReorder(e.target.value)}
          error={errors.reorder}
        />
      </div>
    </Modal>
  );
}
