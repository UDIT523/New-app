import { useEffect, useState } from "react";
import Modal from "../ui/Modal";
import Button from "../ui/Button";
import Input from "../ui/Input";
import Select from "../ui/Select";
import { useToast } from "../ui/Toast";
import { useFinishedGoodsMutations } from "../../hooks/useFinishedGoods";

export default function FinishedItemFormModal({
  open,
  onClose,
  groups,
  defaultGroupId,
  editItem,
}) {
  const isEdit = Boolean(editItem);

  const toast = useToast();

  const {
    addItem,
    editItem: edit,
  } = useFinishedGoodsMutations();

  const [groupId, setGroupId] = useState("");
  const [name, setName] = useState("");
  const [unit, setUnit] = useState("");
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!open) return;

    setErrors({});

    if (editItem) {
      setGroupId(editItem.groupId);
      setName(editItem.name);
      setUnit(editItem.unit || "");
    } else {
      setGroupId(
        defaultGroupId ||
          groups[0]?.id ||
          ""
      );
      setName("");
      setUnit("");
    }
  }, [
    open,
    editItem,
    defaultGroupId,
    groups,
  ]);

  const validate = () => {
    const next = {};

    if (!groupId)
      next.groupId = "Required";

    if (!name.trim())
      next.name = "Required";

    if (!unit.trim())
      next.unit = "Required";

    setErrors(next);

    return (
      Object.keys(next).length === 0
    );
  };

  const submit = async () => {
    if (!validate()) return;

    try {
      if (isEdit) {
        await edit.mutateAsync({
          itemId: editItem.id,
          name,
          unit,
        });

        toast.success(
          "Item updated",
          name.trim()
        );
      } else {
        await addItem.mutateAsync({
          groupId,
          name,
          unit,
        });

        toast.success(
          "Item added",
          name.trim()
        );
      }

      onClose();
    } catch (e) {
      toast.error(
        "Could not save item",
        e.message
      );
    }
  };

  const saving =
    addItem.isPending ||
    edit.isPending;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={
        isEdit
          ? "Edit item"
          : "Add item"
      }
      description="Manage finished goods inventory."
      footer={
        <>
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </Button>

          <Button
            onClick={submit}
            loading={saving}
          >
            {isEdit
              ? "Save changes"
              : "Add item"}
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
            onChange={(e) =>
              setGroupId(
                e.target.value
              )
            }
            disabled={isEdit}
            error={errors.groupId}
          >
            <option value="">
              Select a group...
            </option>

            {groups.map((g) => (
              <option
                key={g.id}
                value={g.id}
              >
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
            onChange={(e) =>
              setName(
                e.target.value
              )
            }
            placeholder="e.g. Mango Pickle 500g"
            error={errors.name}
          />
        </div>

        <Input
          label="Unit"
          required
          value={unit}
          onChange={(e) =>
            setUnit(
              e.target.value
            )
          }
          placeholder="Kg, Pcs, Boxes..."
          error={errors.unit}
        />
      </div>
    </Modal>
  );
}