import { useEffect, useState } from "react";
import "./DetailsPanel.css";
import { formatLastWatered } from "./DateFormatter";

function Row({ label, value }) {
  return (
    <div className="detailsRow">
      <span className="detailsLabel">{label}:</span>
      <span className="detailsValue">{value}</span>
    </div>
  );
}

export default function DetailsPanel({ pin, onClose, onUpdatePin }) {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState({
    name: pin.name ?? "",
    type: pin.type ?? "",
    wateringIntervalDays:
      pin.wateringIntervalDays == null ? "" : String(pin.wateringIntervalDays),
  });
  const [errors, setErrors] = useState({});

  const resetDraftFromPin = () => {
    setDraft({
      name: pin.name ?? "",
      type: pin.type ?? "",
      wateringIntervalDays:
        pin.wateringIntervalDays == null ? "" : String(pin.wateringIntervalDays),
    });
    setErrors({});
  };

  const setField = (key, value) => {
    setDraft((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    setIsEditing(false);
    resetDraftFromPin();
  }, [pin.id]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    resetDraftFromPin();
  };

  const handleSave = () => {
    const nextErrors = {};

    const nameTrimmed = draft.name.trim();
    const typeTrimmed = draft.type.trim();

    // Name validation
    if (nameTrimmed.length === 0) {
      nextErrors.name = "This plant deserves a name.";
    }

    // Type validation
    if (typeTrimmed.length === 0) {
      nextErrors.type = "Give it a type so you remember what it is.";
    }

    // Interval validation
    let nextInterval = null;
    const intervalTrimmed = draft.wateringIntervalDays.trim();

    if (intervalTrimmed !== "") {
      const parsed = Number(intervalTrimmed);

      const isInteger = Number.isInteger(parsed);
      const isValid = isInteger && parsed >= 1;

      if (!isValid) {
        nextErrors.wateringIntervalDays = "Give me whole days (1 or more).";
      } else {
        nextInterval = parsed;
      }
    }

    // If errors exist, show them and do NOT exit edit mode
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    // No errors: clear errors + save
    setErrors({});
    onUpdatePin(pin.id, {
      name: nameTrimmed,
      type: typeTrimmed,
      wateringIntervalDays: nextInterval,
    });

    setIsEditing(false);
  };

  return (
    <aside className="detailsPanel" onClick={(e) => e.stopPropagation()}>
      <div className="detailsHeader">
        <div className="detailsTitle">Details</div>

        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {!isEditing ? (
            <button onClick={handleEdit}>Edit</button>
          ) : (
            <>
              <button onClick={handleSave}>Save</button>
              <button onClick={handleCancel}>Cancel</button>
            </>
          )}

          <button
            className="detailsCloseBtn"
            onClick={onClose}
            aria-label="Close details"
          >
            X
          </button>
        </div>
      </div>


      <div className="detailsBody">
        <div className="detailsSection">
          <div className="detailsSectionTitle">Header</div>
          <Row label="ID" value={pin.id} />
            {!isEditing ? (
              <Row label="Name" value={pin.name} />
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
              <Row label="Type" value={pin.type} />
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

        <div className="detailsSection">
          <div className="detailsSectionTitle">Watering</div>
          <Row label="Last watered" value={formatLastWatered(pin.lastWatered)} />
          {!isEditing ? (
            <Row
              label="Frequency"
              value={
                pin.wateringIntervalDays == null
                  ? "Unknown"
                  : `${pin.wateringIntervalDays} days`
              }
            />
          ) : (
            <div className="detailsRow">
              <span className="detailsLabel">Frequency:</span>
              <span className="detailsValue">
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Unknown"
                  value={draft.wateringIntervalDays}
                  onChange={(e) => setField("wateringIntervalDays", e.target.value)}
                  className={errors.wateringIntervalDays ? "inputError" : ""}
                />
                {errors.wateringIntervalDays && (
                  <div className="errorText">{errors.wateringIntervalDays}</div>
                )}
                <span style={{ marginLeft: 8 }}>days</span>
              </span>
            </div>
          )}
        </div>

        <div className="detailsSection">
          <div className="detailsSectionTitle">Fertilising</div>
          <Row label="Last fertilised" value="Not set" />
          <Row label="Type" value="Not set" />
          <Row label="Frequency" value="Not set" />
        </div>

        <div className="detailsSection">
          <div className="detailsSectionTitle">Seasonal care</div>
          <Row label="Pruning notes" value="Not set" />
          <Row label="Winter preparation" value="Not set" />
        </div>
      </div>
    </aside>
  );
}