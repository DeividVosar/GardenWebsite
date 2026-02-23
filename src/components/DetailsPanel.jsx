import { useEffect, useMemo, useState } from "react";
import "./DetailsPanel.css";
import { formatLastWatered } from "./DateFormatter";

/**
 * DetailsPanel
 * Side panel for viewing and editing a single pin.
 *
 * Design choices:
 * - Keeps a local `draft` while editing so typing doesn't instantly mutate global state.
 * - Validates inputs before saving.
 * - Sends a PATCH with only changed fields.
 *
 * Props:
 * - pin: selected pin object
 * - onClose(): closes the panel
 * - onUpdatePin(pinId, patch): async updater (PATCH)
 * - onDeletePin(pinId): deletes pin
 */

const FALLBACK_NAME = "New little plant";
const FALLBACK_TYPE = "Plantus unidentifiedus";

function Row({ label, value }) {
  return (
    <div className="detailsRow">
      <span className="detailsLabel">{label}:</span>
      <span className="detailsValue">{value}</span>
    </div>
  );
}

function normalizeText(value) {
  return (value ?? "").trim();
}

function formatFrequency(days) {
  if (days == null) return "Unknown";
  if (days === 1) return "Every day";
  return `Every ${days} days`;
}

/**
 * Parses the watering interval input.
 * - "" => null (Unknown)
 * - integer >= 1 => number
 * - otherwise => error message
 */
function parseInterval(input) {
  const trimmed = normalizeText(input);

  if (trimmed === "") return { value: null, error: "" };
  if (!/^\d+$/.test(trimmed)) return { value: null, error: "Give me whole days (1 or more)." };

  const n = Number(trimmed);
  if (!Number.isInteger(n) || n < 1) return { value: null, error: "Give me whole days (1 or more)." };

  return { value: n, error: "" };
}

export default function DetailsPanel({ pin, onClose, onUpdatePin, onDeletePin }) {
  const [isEditing, setIsEditing] = useState(false);

  const [draft, setDraft] = useState({
    name: pin.name ?? "",
    type: pin.type ?? "",
    wateringIntervalDays: pin.wateringIntervalDays == null ? "" : String(pin.wateringIntervalDays),
  });

  const [errors, setErrors] = useState({});

  const resetDraftFromPin = () => {
    setDraft({
      name: pin.name ?? "",
      type: pin.type ?? "",
      wateringIntervalDays: pin.wateringIntervalDays == null ? "" : String(pin.wateringIntervalDays),
    });
    setErrors({});
  };

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  // When pin changes, exit edit mode and reset draft.
  useEffect(() => {
    setIsEditing(false);
    resetDraftFromPin();
  }, [pin.id]);

  const displayName = useMemo(() => {
    const n = normalizeText(pin.name);
    return n.length ? n : FALLBACK_NAME;
  }, [pin.name]);

  const displayType = useMemo(() => {
    const t = normalizeText(pin.type);
    return t.length ? t : FALLBACK_TYPE;
  }, [pin.type]);

  const intervalParsed = useMemo(
    () => parseInterval(draft.wateringIntervalDays),
    [draft.wateringIntervalDays]
  );

  const handleEdit = () => setIsEditing(true);

  const handleCancel = () => {
    setIsEditing(false);
    resetDraftFromPin();
  };

  const handleDelete = () => {
    const name = normalizeText(pin.name);
    const label = name ? `"${name}"` : "this pin";

    const ok = window.confirm(`Delete ${label}? This cannot be undone.`);
    if (!ok) return;

    onDeletePin?.(pin.id);
  };

  const handleSave = async () => {
    const nextErrors = {};

    const nameTrimmed = normalizeText(draft.name);
    const typeTrimmed = normalizeText(draft.type);

    if (nameTrimmed.length === 0) nextErrors.name = "This plant deserves a name.";
    if (typeTrimmed.length === 0) nextErrors.type = "Give it a type so you remember what it is.";

    if (intervalParsed.error) nextErrors.wateringIntervalDays = intervalParsed.error;

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // Build patch: only send changed fields.
    const patch = {};
    const currentName = normalizeText(pin.name);
    const currentType = normalizeText(pin.type);
    const currentInterval = pin.wateringIntervalDays ?? null;

    if (nameTrimmed !== currentName) patch.name = nameTrimmed;
    if (typeTrimmed !== currentType) patch.type = typeTrimmed;
    if (intervalParsed.value !== currentInterval) patch.wateringIntervalDays = intervalParsed.value;

    if (Object.keys(patch).length === 0) {
      setErrors({});
      setIsEditing(false);
      return;
    }

    setErrors({});
    try {
      await onUpdatePin(pin.id, patch);
      setIsEditing(false);
    } catch (e) {
      setErrors((prev) => ({ ...prev, server: e?.message ?? "Save failed" }));
    }
  };

  return (
    <aside className="detailsPanel" onClick={(e) => e.stopPropagation()}>
      <div className="detailsHeader">
        <div className="detailsTitle">Details</div>

        <div className="detailsActions">
          {!isEditing ? (
            <button onClick={handleEdit}>Edit</button>
          ) : (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </>
          )}

          <button className="detailsCloseBtn" onClick={onClose} aria-label="Close details">
            ×
          </button>
        </div>
      </div>

      {errors.server && <div className="detailsServerError">{errors.server}</div>}

      <div className="detailsScroll">
        <div className="detailsBody">
          {/* ===== General ===== */}
          <div className="detailsSection">
            <div className="detailsSectionTitle">General</div>
            <Row label="ID" value={pin.id} />

            {!isEditing ? (
              <Row label="Name" value={displayName} />
            ) : (
              <div className="detailsRow">
                <span className="detailsLabel">Name:</span>
                <span className="detailsValue">
                  <input
                    value={draft.name}
                    onChange={(e) => setField("name", e.target.value)}
                    className={errors.name ? "inputError" : ""}
                  />
                  {errors.name && <div className="errorText">{errors.name}</div>}
                </span>
              </div>
            )}

            {!isEditing ? (
              <Row label="Type" value={displayType} />
            ) : (
              <div className="detailsRow">
                <span className="detailsLabel">Type:</span>
                <span className="detailsValue">
                  <input
                    value={draft.type}
                    onChange={(e) => setField("type", e.target.value)}
                    className={errors.type ? "inputError" : ""}
                  />
                  {errors.type && <div className="errorText">{errors.type}</div>}
                </span>
              </div>
            )}
          </div>

          {/* ===== Watering ===== */}
          <div className="detailsSection">
            <div className="detailsSectionTitle">Watering</div>

            <Row label="Last watered" value={formatLastWatered(pin.lastWatered)} />

            {!isEditing ? (
              <Row label="Frequency" value={formatFrequency(pin.wateringIntervalDays)} />
            ) : (
              <div className="detailsRow">
                <span className="detailsLabel">Frequency:</span>
                <span className="detailsValue">
                  <input
                    inputMode="numeric"
                    placeholder="Unknown"
                    value={draft.wateringIntervalDays}
                    onChange={(e) => setField("wateringIntervalDays", e.target.value)}
                    className={errors.wateringIntervalDays ? "inputError" : ""}
                  />
                  {errors.wateringIntervalDays && (
                    <div className="errorText">{errors.wateringIntervalDays}</div>
                  )}
                  <span className="detailsInlineSuffix">days</span>
                </span>
              </div>
            )}
          </div>

          {/* ===== Future sections (placeholders) ===== */}
          <div className="detailsSection detailsSectionMuted">
            <div className="detailsSectionTitle">Fertilising</div>
            <Row label="Status" value="Not implemented yet" />
          </div>

          <div className="detailsSection detailsSectionMuted">
            <div className="detailsSectionTitle">Seasonal care</div>
            <Row label="Status" value="Not implemented yet" />
          </div>

          {isEditing && (
            <div className="deleteBlock">
              <button className="dangerButton" onClick={handleDelete}>
                Delete pin
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
}
