import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listInventory,
  createGroup,
  deleteGroup,
  createItem,
  updateItem,
  deleteItem,
} from "../services/inventoryService";
import {
  addRecordDate,
  saveRecords,
  importWorkbook,
} from "../services/recordsService";
import { useRealtime } from "./useRealtime";

const KEY = ["inventory"];

export function useInventory() {
  useRealtime("material_groups", KEY);
  useRealtime("items", KEY);
  useRealtime("record_dates", KEY);
  useRealtime("stock_records", KEY);
  return useQuery({ queryKey: KEY, queryFn: listInventory });
}

export function useInventoryMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: KEY });

  const addGroup = useMutation({ mutationFn: createGroup, onSuccess: invalidate });
  const removeGroup = useMutation({ mutationFn: deleteGroup, onSuccess: invalidate });
  const addItem = useMutation({ mutationFn: createItem, onSuccess: invalidate });
  const editItem = useMutation({
    mutationFn: ({ itemId, ...fields }) => updateItem(itemId, fields),
    onSuccess: invalidate,
  });
  const removeItem = useMutation({ mutationFn: deleteItem, onSuccess: invalidate });
  const addDate = useMutation({ mutationFn: addRecordDate, onSuccess: invalidate });
  const save = useMutation({ mutationFn: saveRecords, onSuccess: invalidate });
  const importMany = useMutation({ mutationFn: importWorkbook, onSuccess: invalidate });

  return {
    addGroup,
    removeGroup,
    addItem,
    editItem,
    removeItem,
    addDate,
    save,
    importMany,
  };
}
