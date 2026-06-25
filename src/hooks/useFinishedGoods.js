import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import {
  listFinishedGoods,
  createFinishedGroup,
  deleteFinishedGroup,
  createFinishedItem,
  updateFinishedItem,
  deleteFinishedItem,
} from "../services/finishedGoodsService";

import {
  addFinishedRecordDate,
  saveFinishedRecords,
  importFinishedWorkbook,
} from "../services/finishedRecordsService";

import { useRealtime } from "./useRealtime";

const KEY = ["finished-goods"];

export function useFinishedGoods() {
  useRealtime(
    "finished_groups",
    KEY
  );

  useRealtime(
    "finished_items",
    KEY
  );

  useRealtime(
    "finished_record_dates",
    KEY
  );

  useRealtime(
    "finished_stock_records",
    KEY
  );

  return useQuery({
    queryKey: KEY,
    queryFn: listFinishedGoods,
  });
}

export function useFinishedGoodsMutations() {
  const qc = useQueryClient();

  const invalidate = () =>
    qc.invalidateQueries({
      queryKey: KEY,
    });

  const addGroup = useMutation({
    mutationFn:
      createFinishedGroup,
    onSuccess: invalidate,
  });

  const removeGroup =
    useMutation({
      mutationFn:
        deleteFinishedGroup,
      onSuccess: invalidate,
    });

  const addItem = useMutation({
    mutationFn:
      createFinishedItem,
    onSuccess: invalidate,
  });

  const editItem = useMutation({
    mutationFn: ({
      itemId,
      ...fields
    }) =>
      updateFinishedItem(
        itemId,
        fields
      ),

    onSuccess: invalidate,
  });

  const removeItem =
    useMutation({
      mutationFn:
        deleteFinishedItem,
      onSuccess: invalidate,
    });

  const addDate = useMutation({
    mutationFn:
      addFinishedRecordDate,
    onSuccess: invalidate,
  });

  const save = useMutation({
    mutationFn:
      saveFinishedRecords,
    onSuccess: invalidate,
  });

  const importMany =
    useMutation({
      mutationFn:
        importFinishedWorkbook,
      onSuccess: invalidate,
    });

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