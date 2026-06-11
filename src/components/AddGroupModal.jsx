export default function AddGroupModal({
  open,
  onClose,
  onAdd,
  groupName,
  setGroupName,
}) {
  if (!open) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <h2>Add Group</h2>

        <input
          type="text"
          placeholder="Group Name"
          value={groupName}
          onChange={(e) => setGroupName(e.target.value)}
        />

        <div className="modal-buttons">
          <button onClick={onClose}>Cancel</button>

          <button onClick={onAdd}>
            Add Group
          </button>
        </div>
      </div>
    </div>
  );
}