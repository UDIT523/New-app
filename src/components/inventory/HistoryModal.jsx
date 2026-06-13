import Modal from "../ui/Modal";
import {
  formatDisplayDate,
  formatNumber,
} from "../../utils/format";

export default function HistoryModal({
  open,
  onClose,
  group,
}) {
  if (!group) return null;

  const dates = [
    ...(group.recordDates || []),
  ].reverse();

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`History - ${group.name}`}
    >
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead>
            <tr className="border-b border-ink-100">
              <th className="px-3 py-2 text-left">
                Item
              </th>

              {dates.map((date) => (
                <th
                  key={date}
                  className="px-3 py-2 text-right whitespace-nowrap"
                >
                  {formatDisplayDate(
                    date
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {group.items.map((item) => (
              <tr
                key={item.id}
                className="border-b border-ink-50"
              >
                <td className="px-3 py-2 font-medium whitespace-nowrap">
                  {item.name} (
                  {item.reorder})
                </td>

                {dates.map((date) => (
                  <td
                    key={date}
                    className="px-3 py-2 text-right"
                  >
                    {item.records &&
                    date in item.records
                      ? formatNumber(
                          item.records[
                            date
                          ]
                        )
                      : "—"}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        {!group.items.length && (
          <div className="py-6 text-center text-sm text-ink-500">
            No history available.
          </div>
        )}
      </div>
    </Modal>
  );
}