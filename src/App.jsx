import * as XLSX from "xlsx";
import { useState, useEffect } from "react";
import sampleData from "./data/sampleData";
import GroupTable from "./components/GroupTable";
import AddGroupModal from "./components/AddGroupModal";
import AddItemModal from "./components/AddItemModal";

function App() {
  const [groups, setGroups] = useState(() => {
    const saved = localStorage.getItem("raw-material-groups");

    return saved
      ? JSON.parse(saved)
      : sampleData;
  });

  const [showAddGroup, setShowAddGroup] = useState(false);
  const [showAddItem, setShowAddItem] = useState(false);

  const [groupName, setGroupName] = useState("");

  const [itemData, setItemData] = useState({
    group: "",
    name: "",
    reorder: "",
    unit: "",
  });

  useEffect(() => {
    localStorage.setItem(
      "raw-material-groups",
      JSON.stringify(groups)
    );
  }, [groups]);

const updateRecord = (
  groupId,
  itemId,
  date,
  qty
) => {
  setGroups((prev) =>
    prev.map((group) => {
      if (group.id !== groupId)
        return group;

      return {
        ...group,
        items: group.items.map((item) => {
          if (item.id !== itemId)
            return item;

          const records =
            item.records || [];

          const existing =
            records.findIndex(
              (r) => r.date === date
            );

          if (existing >= 0) {
            return {
              ...item,
              records: records.map(
                (r, index) =>
                  index === existing
                    ? {
                        ...r,
                        qty,
                      }
                    : r
              ),
            };
          }

          return {
            ...item,
            records: [
              ...records,
              {
                date,
                qty,
              },
            ],
          };
        }),
      };
    })
  );
};

const addDateColumn = (groupId) => {
  const today =
    new Date().toLocaleDateString(
      "en-GB",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );

  setGroups((prev) =>
    prev.map((group) => {
      if (group.id !== groupId)
        return group;

      const alreadyExists =
        group.recordDates?.includes(
          today
        );

      if (alreadyExists)
        return group;

      return {
        ...group,
        recordDates: [
          ...(group.recordDates ||
            []),
          today,
        ],
      };
    })
  );
};

  const addGroup = () => {
    if (!groupName.trim()) return;

    const newGroup = {
  id: Date.now(),
  name: groupName,
  items: [],
  recordDates: [],
};

    setGroups([...groups, newGroup]);

    setGroupName("");
    setShowAddGroup(false);
  };

  const addItem = () => {
    if (
      !itemData.group ||
      !itemData.name ||
      !itemData.reorder ||
      !itemData.unit
    ) {
      return;
    }

    setGroups(
      groups.map((group) => {
        if (group.id !== Number(itemData.group))
          return group;

        return {
          ...group,
          items: [
            ...group.items,
            {
  id: Date.now(),
  name: itemData.name,
  reorder: Number(itemData.reorder),
  unit: itemData.unit,
  records: [],
}
          ],
        };
      })
    );

    setItemData({
      group: "",
      name: "",
      reorder: "",
      unit: "",
    });

    setShowAddItem(false);
  };

  const saveStock = () => {
    localStorage.setItem(
      "raw-material-groups",
      JSON.stringify(groups)
    );

    alert("Stock saved successfully!");
  };

  const resetData = () => {
    localStorage.removeItem(
      "raw-material-groups"
    );

    window.location.reload();
  };

  const exportToExcel = () => {
  const rows = [];

  groups.forEach((group) => {
    rows.push([group.name]);

    const dates =
      group.recordDates || [];

    rows.push([
      "Item",
      "Unit",
      "Reorder",
      ...dates,
    ]);

    group.items.forEach((item) => {
      const row = [
        item.name,
        item.unit,
        item.reorder,
      ];

      dates.forEach((date) => {
        const record =
          item.records?.find(
            (r) => r.date === date
          );

        row.push(
          record?.qty ?? "-"
        );
      });

      rows.push(row);
    });

    rows.push([]);
    rows.push([]);
  });

  const worksheet =
    XLSX.utils.aoa_to_sheet(rows);

  const workbook =
    XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(
    workbook,
    worksheet,
    "Raw Materials"
  );

  XLSX.writeFile(
    workbook,
    "Raw_Materials.xlsx"
  );
};

const importFromExcel = (event) => {
  const file = event.target.files[0];

  if (!file) return;

  const reader = new FileReader();

  reader.onload = (e) => {
    const data = new Uint8Array(
      e.target.result
    );

    const workbook = XLSX.read(data, {
      type: "array",
    });

    const sheet =
      workbook.Sheets[
        workbook.SheetNames[0]
      ];

    const rows =
      XLSX.utils.sheet_to_json(sheet, {
        header: 1,
      });

    const importedGroups = [];

    let currentGroup = null;
    let currentDates = [];

    rows.forEach((row) => {
      if (
        !row ||
        row.length === 0 ||
        row.every(
          (cell) =>
            cell === undefined ||
            cell === ""
        )
      ) {
        return;
      }

      const firstCell = String(
        row[0] || ""
      ).trim();

      // Group Name Row
      if (
        row.length === 1 &&
        firstCell
      ) {
        currentGroup = {
          id:
            Date.now() +
            Math.random(),
          name: firstCell,
          items: [],
          recordDates: [],
        };

        importedGroups.push(
          currentGroup
        );

        return;
      }

      // Header Row
      if (
        firstCell === "Item"
      ) {
        currentDates =
          row.slice(3);

        if (currentGroup) {
          currentGroup.recordDates =
            currentDates;
        }

        return;
      }

      // Item Row
      if (
        currentGroup &&
        firstCell !== "Item"
      ) {
        const item = {
          id:
            Date.now() +
            Math.random(),

          name:
            row[0] || "",

          unit:
            row[1] || "",

          reorder:
            Number(row[2]) || 0,

          records: [],
        };

        currentDates.forEach(
          (date, index) => {
            const value =
              row[index + 3];

            if (
              value !== undefined &&
              value !== "-" &&
              value !== ""
            ) {
              item.records.push({
                date,
                qty:
                  Number(
                    value
                  ),
              });
            }
          }
        );

        currentGroup.items.push(
          item
        );
      }
    });

    setGroups(importedGroups);

    localStorage.setItem(
      "raw-material-groups",
      JSON.stringify(
        importedGroups
      )
    );

    alert(
      `Imported ${importedGroups.length} groups successfully`
    );
  };

  reader.readAsArrayBuffer(file);
};

  return (
    <div style={{ padding: "40px" }}>
      <h1>Raw Materials</h1>

      <div style={{ marginBottom: "20px" }}>
        <button
          onClick={() => setShowAddGroup(true)}
        >
          Add Group
        </button>{" "}

        <button
          onClick={() => setShowAddItem(true)}
        >
          Add Item
        </button>{" "}

        <>
  <input
    type="file"
    accept=".xlsx,.xls"
    id="importFile"
    style={{ display: "none" }}
    onChange={importFromExcel}
  />

  <button
    onClick={() =>
      document
        .getElementById("importFile")
        .click()
    }
  >
    Import
  </button>
</>

        <button onClick={exportToExcel}>
  Export
</button>

        <button onClick={resetData}>
          Reset Data
        </button>
      </div>

      <GroupTable
  groups={groups}
  updateRecord={updateRecord}
  addDateColumn={addDateColumn}
/>

      <button onClick={saveStock}>
        Save Stock
      </button>

      <AddGroupModal
        open={showAddGroup}
        onClose={() =>
          setShowAddGroup(false)
        }
        onAdd={addGroup}
        groupName={groupName}
        setGroupName={setGroupName}
      />

      <AddItemModal
        open={showAddItem}
        onClose={() =>
          setShowAddItem(false)
        }
        groups={groups}
        itemData={itemData}
        setItemData={setItemData}
        onAdd={addItem}
      />
    </div>
  );
}

export default App;