import { useMemo, useState } from "react";
import { Boxes, Plus, Search } from "lucide-react";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import EmptyState from "../components/ui/EmptyState";
import Skeleton from "../components/ui/Skeleton";
import { cn } from "../utils/cn";
import { useInventory } from "../hooks/useInventory";
import { useAuth } from "../context/AuthContext";
import GroupSection from "../components/inventory/GroupSection";
import GroupFormModal from "../components/inventory/GroupFormModal";
import ItemFormModal from "../components/inventory/ItemFormModal";
import ImportExportButtons from "../components/inventory/ImportExportButtons";
import StockOverview from "../components/inventory/StockOverview";

export default function Inventory() {
  const { data: groups = [], isLoading } =
    useInventory();

  const { can } = useAuth();

  const [search, setSearch] =
    useState("");

  const [lowOnly, setLowOnly] =
    useState(false);

  const [showAddGroup, setShowAddGroup] =
    useState(false);

  const [itemModal, setItemModal] =
    useState(null);

  const filtered = useMemo(() => {
    const q =
      search.trim().toLowerCase();

    return groups
      .map((g) => {
        let items = g.items;

        if (lowOnly) {
          items = items.filter(
            (i) => i.isLow
          );
        }

        if (
          q &&
          !g.name
            .toLowerCase()
            .includes(q)
        ) {
          items = items.filter(
            (i) =>
              i.name
                .toLowerCase()
                .includes(q)
          );
        }

        return {
          ...g,
          items,
        };
      })
      .filter((g) => {
        if (!q && !lowOnly)
          return true;

        if (
          q &&
          g.name
            .toLowerCase()
            .includes(q) &&
          !lowOnly
        ) {
          return true;
        }

        return (
          g.items.length > 0
        );
      });
  }, [groups, search, lowOnly]);

  const filtering =
    Boolean(search.trim()) ||
    lowOnly;

  return (
    <div>
      <PageHeader
        title="Raw Materials"
        description="Daily stock recording by material group."
        actions={
          <>
            <ImportExportButtons
              groups={groups}
            />

            {can(
              "inventory:manage"
            ) && (
              <>
                <Button
                  variant="secondary"
                  onClick={() =>
                    setItemModal({})
                  }
                  disabled={
                    !groups.length
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>

                <Button
                  onClick={() =>
                    setShowAddGroup(
                      true
                    )
                  }
                >
                  <Plus className="h-4 w-4" />
                  Add Group
                </Button>
              </>
            )}
          </>
        }
      />

      {!isLoading && groups.length > 0 && (
        <StockOverview groups={groups} />
      )}

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="w-full sm:max-w-xs">
          <Input
            icon={Search}
            placeholder="Search items or groups…"
            value={search}
            onChange={(e) =>
              setSearch(
                e.target.value
              )
            }
          />
        </div>

        <button
          onClick={() =>
            setLowOnly(
              (v) => !v
            )
          }
          className={cn(
            "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-sm font-medium transition-all duration-150",
            lowOnly
              ? "border-danger bg-danger-soft text-danger"
              : "border-ink-200 bg-white text-ink-500 hover:bg-ink-50 hover:text-ink-900"
          )}
        >
          Low stock only
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      ) : !groups.length ? (
        <EmptyState
          icon={Boxes}
          title="No material groups yet"
          description="Create your first group, add items, then record daily stock — or import an existing Excel sheet."
          action={
            can(
              "inventory:manage"
            ) ? (
              <Button
                onClick={() =>
                  setShowAddGroup(
                    true
                  )
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
          description="No items match the current search or filter."
        />
      ) : (
        <div className="space-y-4">
          {filtered.map((g) => (
            <GroupSection
              key={g.id}
              group={g}
              forceExpand={
                filtering
              }
              onEditItem={(
                item,
                groupId
              ) =>
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

      <GroupFormModal
        open={showAddGroup}
        onClose={() =>
          setShowAddGroup(
            false
          )
        }
      />

      <ItemFormModal
        open={Boolean(
          itemModal
        )}
        onClose={() =>
          setItemModal(null)
        }
        groups={groups}
        defaultGroupId={
          itemModal?.defaultGroupId
        }
        editItem={
          itemModal?.editItem
        }
      />
    </div>
  );
}