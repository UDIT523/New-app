export default function AddItemModal({
  open,
  onClose,
  groups,
  itemData,
  setItemData,
  onAdd,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Add Item</h2>

        <select
          value={itemData.group}
          onChange={(e) =>
            setItemData({
              ...itemData,
              group: e.target.value,
            })
          }
        >
          <option value="">
            Select Group
          </option>

          {groups.map((g) => (
            <option
              key={g.id}
              value={g.id}
            >
              {g.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Item Name"
          value={itemData.name}
          onChange={(e) =>
            setItemData({
              ...itemData,
              name: e.target.value,
            })
          }
        />

        <input
          type="number"
          placeholder="Reorder Level"
          value={itemData.reorder}
          onChange={(e) =>
            setItemData({
              ...itemData,
              reorder: e.target.value,
            })
          }
        />

        <input
          type="text"
          placeholder="Unit"
          value={itemData.unit}
          onChange={(e) =>
            setItemData({
              ...itemData,
              unit: e.target.value,
            })
          }
        />

        <div className="modal-buttons">
          <button onClick={onClose}>
            Cancel
          </button>

          <button onClick={onAdd}>
            Add Item
          </button>
        </div>
      </div>
    </div>
  );
}