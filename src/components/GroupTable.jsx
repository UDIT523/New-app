import { useState } from "react";

export default function GroupTable({
  groups,
  updateQuantity,
}) {
  const [openGroups, setOpenGroups] = useState({});
  const [editingGroups, setEditingGroups] = useState({});

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const startRecording = (groupId) => {
    const today = new Date().toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

    const group = groups.find(
      (g) => g.id === groupId
    );

    if (group) {
      group.recordDate = today;
    }

    setEditingGroups((prev) => ({
      ...prev,
      [groupId]: true,
    }));
  };

  const stopRecording = (groupId) => {
    setEditingGroups((prev) => ({
      ...prev,
      [groupId]: false,
    }));

    alert("Stock recorded successfully");
  };

  return (
    <>
      {groups.map((group) => (
        <div
          key={group.id}
          style={{
            marginBottom: "25px",
          }}
        >
          <h2
            style={{
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
            onClick={() =>
              toggleGroup(group.id)
            }
          >
            {openGroups[group.id]
              ? "▼"
              : "▶"}

            {group.name}
          </h2>

          {openGroups[group.id] && (
            <>
              <div
                style={{
                  marginBottom: "10px",
                }}
              >
                {!editingGroups[group.id] ? (
                  <button
                    onClick={() =>
                      startRecording(group.id)
                    }
                  >
                    Record
                  </button>
                ) : (
                  <button
                    onClick={() =>
                      stopRecording(group.id)
                    }
                  >
                    Save
                  </button>
                )}
              </div>

              <div
                style={{
                  marginBottom: "10px",
                  color: "gray",
                }}
              >
                Date:{" "}
                {group.recordDate ||
                  "Not Recorded"}
              </div>

              <table
                border="1"
                cellPadding="10"
                style={{
                  width: "100%",
                  borderCollapse:
                    "collapse",
                }}
              >
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Unit</th>
                    <th>Reorder</th>
                    <th>
                      {group.recordDate ||
                        "Current Stock"}
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {group.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.name}</td>

                      <td>{item.unit}</td>

                      <td>{item.reorder}</td>

                      <td>
                        <input
                          type="number"
                          value={
                            item.quantity
                          }
                          disabled={
                            !editingGroups[
                              group.id
                            ]
                          }
                          onChange={(e) =>
                            updateQuantity(
                              group.id,
                              item.id,
                              Number(
                                e.target
                                  .value
                              )
                            )
                          }
                          style={{
                            width:
                              "100px",
                            backgroundColor:
                              editingGroups[
                                group.id
                              ]
                                ? "white"
                                : "#f0f0f0",
                          }}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      ))}
    </>
  );
}