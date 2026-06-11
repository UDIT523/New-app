import { useRef } from "react";
import { Download, Upload } from "lucide-react";
import Button from "../ui/Button";
import { useToast } from "../ui/Toast";
import { useInventoryMutations } from "../../hooks/useInventory";
import { exportRawMaterials, parseRawMaterialsFile } from "../../utils/excel";

export default function ImportExportButtons({ groups }) {
  const toast = useToast();
  const { importMany } = useInventoryMutations();
  const fileRef = useRef(null);

  const onExport = () => {
    if (!groups.length) {
      toast.info("Nothing to export", "Add a group and some items first.");
      return;
    }
    exportRawMaterials(groups);
    toast.success("Exported", "Raw_Materials.xlsx downloaded");
  };

  const onPickFile = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    try {
      const parsed = await parseRawMaterialsFile(file);
      if (!parsed.length) {
        toast.warning("Nothing imported", "No groups found in that file.");
        return;
      }
      const count = await importMany.mutateAsync(parsed);
      toast.success("Import complete", `${count} group(s) imported`);
    } catch (err) {
      toast.error("Import failed", err.message);
    }
  };

  return (
    <>
      <input
        ref={fileRef}
        type="file"
        accept=".xlsx,.xls"
        className="hidden"
        onChange={onPickFile}
      />
      <Button
        variant="secondary"
        onClick={() => fileRef.current?.click()}
        loading={importMany.isPending}
      >
        <Upload className="h-4 w-4" />
        Import
      </Button>
      <Button variant="secondary" onClick={onExport}>
        <Download className="h-4 w-4" />
        Export
      </Button>
    </>
  );
}
