import { useMemo, useState } from "react";
import HistoryModal from "./HistoryModal";
import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight, ClipboardEdit, Trash2 } from "lucide-react";
import Card from "../ui/Card";
import Button from "../ui/Button";
import Badge from "../ui/Badge";
import EmptyState from "../ui/EmptyState";
import { useToast } from "../ui/Toast";
import { useConfirm } from "../ui/ConfirmDialog";
import { useAuth } from "../../context/AuthContext";
import { useInventoryMutations } from "../../hooks/useInventory";
import { todayISO } from "../../utils/format";
import RecordGrid from "./RecordGrid";

const DATE_WINDOW = 6;

/** One collapsible material group: header with actions + the record grid. */
export default function GroupSection({ group, forceExpand, onEditItem }) {
  const toast = useToast();
  const confirm = useConfirm();
  const { user, can } = useAuth();
  
  const { removeGroup, removeItem, addDate, save } = useInventoryMutations();

  const [expanded, setExpanded] = useState(false);
  const [recording, setRecording] = useState(false);
  const [drafts, setDrafts] = useState({});
  const [showAllDates, setShowAllDates] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const today = todayISO();
  const isOpen = forceExpand || expanded;
  const lowCount = group.items.filter((i) => i.isLow).length;

  const dates = useMemo(() => {
    const all =
      recording && !group.recordDates.includes(today)
        ? [...group.recordDates, today]
        : group.recordDates;
    if (showAllDates || all.length <= DATE_WINDOW) return all;
    return all.slice(-DATE_WINDOW);
  }, [group.recordDates, recording, today, showAllDates]);

  const hiddenDates =
    !showAllDates && group.recordDates.length > DATE_WINDOW
      ? group.recordDates.length - DATE_WINDOW
      : 0;

  const startRecording = () => {
    setDrafts(
      Object.fromEntries(
        group.items
          .filter((i) => today in i.records)
          .map((i) => [i.id, String(i.records[today])])
      )
    );
    setRecording(true);
    setExpanded(true);
    addDate.mutate({ groupId: group.id, date: today });
  };

  const cancelRecording = () => {
    setRecording(false);
    setDrafts({});
  };

  const saveRecording = async () => {
    const rows = group.items
      .filter((i) => {
        const v = drafts[i.id];
        if (v === undefined || v === "") return false;
        const qty = Number(v);
        if (Number.isNaN(qty) || qty < 0) return false;
        return qty !== i.records[today];
      })
      .map((i) => ({
        item_id: i.id,
        record_date: today,
        qty: Number(drafts[i.id]),
        recorded_by: user?.username || null,
      }));

    if (!rows.length) {
      cancelRecording();
      return;
    }

    try {
      await save.mutateAsync(rows);
      toast.success("Stock recorded", `${rows.length} item(s) · ${group.name}`);
      cancelRecording();
    } catch (e) {
      toast.error("Could not save records", e.message);
    }
  };

  const deleteGroup = async () => {
    const ok = await confirm({
      title: "Delete group?",
      message: `"${group.name}" and all of its items and records will be permanently deleted.`,
      confirmText: "Delete group",
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeGroup.mutateAsync(group.id);
      toast.success("Group deleted", group.name);
    } catch (e) {
      toast.error("Could not delete group", e.message);
    }
  };

  const deleteItem = async (item) => {
    const ok = await confirm({
      title: "Delete item?",
      message: `"${item.name}" and its stock history will be permanently deleted.`,
      confirmText: "Delete item",
      destructive: true,
    });
    if (!ok) return;
    try {
      await removeItem.mutateAsync(item.id);
      toast.success("Item deleted", item.name);
    } catch (e) {
      toast.error("Could not delete item", e.message);
    }
  };

  return (
    <Card>
      <div className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex min-w-0 flex-1 items-center gap-2.5 text-left"
        >
          <motion.span
            animate={{ rotate: isOpen ? 90 : 0 }}
            transition={{ duration: 0.15 }}
            className="text-ink-400"
          >
            <ChevronRight className="h-4 w-4" />
          </motion.span>
          <span className="truncate text-lg font-bold tracking-tight text-ink-950">
  {group.name}
</span>
          <Badge variant="outline">{group.items.length} items</Badge>
          {lowCount > 0 && <Badge variant="danger">{lowCount} low</Badge>}
        </button>

        <div className="flex flex-wrap items-center gap-2">

  {!recording && (
    <Button
  size="sm"
  variant="secondary"
  className="md:hidden"
  onClick={() => setShowHistory(true)}
>
  History
</Button>
  )}

  {recording ? (
    <>
      <Button
        size="sm"
        variant="ghost"
        onClick={cancelRecording}
      >
        Cancel
      </Button>

      <Button
        size="sm"
        onClick={saveRecording}
        loading={save.isPending}
      >
        Save
      </Button>
    </>
  ) : (
  <>
    {can("inventory:record") && (
      <Button
        size="sm"
        variant="secondary"
        onClick={startRecording}
        disabled={!group.items.length}
      >
        <ClipboardEdit className="h-4 w-4" />
        Record
      </Button>
    )}

    {can("inventory:manage") && (
      <button
        onClick={deleteGroup}
        className="rounded-xl p-2 text-ink-400 transition-colors hover:bg-danger-soft hover:text-danger"
        aria-label={`Delete ${group.name}`}
      >
        <Trash2 className="h-4 w-4" />
      </button>
    )}
  </>
)}
        </div>
      </div>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5">
              {hiddenDates > 0 && (
                <button
                  onClick={() => setShowAllDates(true)}
                  className="mb-3 text-xs font-medium text-ink-500 hover:text-ink-900"
                >
                  Show {hiddenDates} earlier date{hiddenDates > 1 ? "s" : ""}
                </button>
              )}
              {group.items.length ? (
                <RecordGrid
                  group={group}
                  dates={dates}
                  recording={recording}
                  today={today}
                  drafts={drafts}
                  onDraft={(itemId, value) =>
                    setDrafts((prev) => ({ ...prev, [itemId]: value }))
                  }
                  onCancel={cancelRecording}
                  onEditItem={(item) => onEditItem(item, group.id)}
                  onDeleteItem={deleteItem}
                />
              ) : (
                <EmptyState
                  title="No items in this group"
                  description="Add an item to start recording daily stock."
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      <HistoryModal
  open={showHistory}
  onClose={() => setShowHistory(false)}
  group={group}
/>
    </Card>
  );
}
