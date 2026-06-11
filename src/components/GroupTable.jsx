import { useState } from "react";

export default function GroupTable({
  groups,
  updateRecord,
  addDateColumn,
}) {
  const [openGroups, setOpenGroups] =
    useState({});

  const [editingGroups, setEditingGroups] =
    useState({});

  const toggleGroup = (groupId) => {
    setOpenGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }));
  };

  const startRecording = (groupId) => {
    addDateColumn(groupId);

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
      {groups.map((group) => {
        const dates =
          group.recordDates || [];

        const latestDate =
          dates[dates.length - 1];

        return (
          <div
            key={group.id}
            style={{
              marginBottom: "30px",
            }}
          >
            <h2
              style={{
                cursor: "pointer",
              }}
              onClick={() =>
                toggleGroup(group.id)
              }
            >
              {openGroups[group.id]
                ? "▼ "
                : "▶ "}
              {group.name}
            </h2>

            {openGroups[group.id] && (
              <>
                <div
                  style={{
                    marginBottom: "10px",
                  }}
                >
                  {!editingGroups[
                    group.id
                  ] ? (
                    <button
                      onClick={() =>
                        startRecording(
                          group.id
                        )
                      }
                    >
                      Record
                    </button>
                  ) : (
                    <button
                      onClick={() =>
                        stopRecording(
                          group.id
                        )
                      }
                    >
                      Save
                    </button>
                  )}
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

                      {dates.map(
                        (date) => (
                          <th
                            key={date}
                          >
                            {date}
                          </th>
                        )
                      )}
                    </tr>
                  </thead>

                  <tbody>
                    {group.items.map(
                      (item) => (
                        <tr
                          key={item.id}
                        >
                          <td>
                            {item.name}
                          </td>

                          <td>
                            {item.unit}
                          </td>

                          <td>
                            {
                              item.reorder
                            }
                          </td>

                          {dates.map(
                            (date) => {
                              const record =
                                item.records?.find(
                                  (
                                    r
                                  ) =>
                                    r.date ===
                                    date
                                );

                              const isLatest =
                                date ===
                                latestDate;

                              return (
                                <td
                                  key={
                                    date
                                  }
                                >
                                  <input
                                    type="number"
                                    value={
                                      record?.qty ??
                                      ""
                                    }
                                    disabled={
                                      !(
                                        isLatest &&
                                        editingGroups[
                                          group
                                            .id
                                        ]
                                      )
                                    }
                                    onChange={(
                                      e
                                    ) =>
                                      updateRecord(
                                        group.id,
                                        item.id,
                                        date,
                                        Number(
                                          e
                                            .target
                                            .value
                                        )
                                      )
                                    }
                                    style={{
                                      width:
                                        "90px",
                                      backgroundColor:
                                        isLatest &&
                                        editingGroups[
                                          group
                                            .id
                                        ]
                                          ? "white"
                                          : "#f0f0f0",
                                    }}
                                  />
                                </td>
                              );
                            }
                          )}
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              </>
            )}
          </div>
        );
      })}
    </>
  );
}