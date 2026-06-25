import { useMemo, useState } from "react";
import {
  Boxes,
  Plus,
  Search,
} from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { useFinishedGoods } from "../hooks/useFinishedGoods";
import { useAuth } from "../context/AuthContext";
import FinishedGroupSection from "../components/finishedgoods/FinishedGroupSection";
import FinishedGroupFormModal from "../components/finishedgoods/FinishedGroupFormModal";
import FinishedItemFormModal from "../components/finishedgoods/FinishedItemFormModal";
import FinishedImportExportButtons from "../components/finishedgoods/FinishedImportExportButtons";

export default function FinishedGoods() {
  const { data: groups = [], isLoading } = useFinishedGoods();
  const { can } = useAuth();

  const [search, setSearch] = useState("");
  const [showAddGroup, setShowAddGroup] = useState(false);
  const [itemModal, setItemModal] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    return groups.filter(
      (g) =>
        g.name.toLowerCase().includes(q) ||
        g.items.some((i) =>
          i.name.toLowerCase().includes(q)
        )
    );
  }, [groups, search]);

  return (
    <div>
      <PageHeader
        title="Finished Goods"
        description="Daily stock recording of finished products."
        actions={
  can("inventory:manage") && (
    <div className="flex flex-wrap items-center gap-3">
  <FinishedImportExportButtons
    groups={groups}
  />

  <Button
    variant="secondary"
    onClick={() => setItemModal({})}
    disabled={!groups.length}
  >
    <Plus className="h-4 w-4" />
    Add Item
  </Button>

  <Button
    onClick={() => setShowAddGroup(true)}
  >
    <Plus className="h-4 w-4" />
    Add Group
  </Button>
</div>
  )
}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <Input
            icon={Search}
            placeholder="Search finished goods..."
            value={search}
            onChange={(e) =>
              setSearch(e.target.value)
            }
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : !groups.length ? (
        <EmptyState
          icon={Boxes}
          title="No finished goods groups yet"
          description="Create your first group and start recording stock."
          action={
            can("inventory:manage") ? (
              <Button
                onClick={() =>
                  setShowAddGroup(true)
                }
              >
                <Plus className="h-4 w-4" />
                Add Group
              </Button>
            ) : null
          }
        />
      ) : !filtered.length ? (
        <EmptyState
          icon={Search}
          title="No matches"
          description="No finished goods match your search."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => (
            <FinishedGroupSection
              key={g.id}
              group={g}
              onEditItem={(item, groupId) =>
                setItemModal({
                  editItem: {
                    ...item,
                    groupId,
                  },
                })
              }
            />
          ))}
        </div>
      )}

      <FinishedGroupFormModal
        open={showAddGroup}
        onClose={() =>
          setShowAddGroup(false)
        }
      />

      <FinishedItemFormModal
        open={Boolean(itemModal)}
        onClose={() =>
          setItemModal(null)
        }
        groups={groups}
        defaultGroupId={
          itemModal?.defaultGroupId
        }
        editItem={itemModal?.editItem}
      />
    </div>
  );
}