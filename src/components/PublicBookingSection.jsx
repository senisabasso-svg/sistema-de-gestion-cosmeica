import { useCallback, useEffect, useMemo, useState } from "react";
import { ApiError, crearReservaPublica, fetchDisponibilidad, fetchPeluqueriasActivas } from "../api/publicReservas";

const SLOT_MINUTES = 30;

const getTodayIsoDate = () => new Date().toISOString().slice(0, 10);

const formatSlotHour = (dateTimeString) => {
  const date = new Date(dateTimeString);
  return date.toLocaleTimeString("es-UY", {
    hour: "2-digit",
    minute: "2-digit",
  });
};

const formatFriendlyDateTime = (dateTimeString) => {
  const date = new Date(dateTimeString);
  return date.toLocaleString("es-UY", {
    weekday: "short",
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export default function PublicBookingSection() {
  const [peluquerias, setPeluquerias] = useState([]);
  const [loadingPeluquerias, setLoadingPeluquerias] = useState(true);
  const [errorPeluquerias, setErrorPeluquerias] = useState("");
  const [selectedPeluqueriaId, setSelectedPeluqueriaId] = useState("");
  const [selectedFecha, setSelectedFecha] = useState(getTodayIsoDate);

  const [slots, setSlots] = useState([]);
  const [loadingDisponibilidad, setLoadingDisponibilidad] = useState(false);
  const [errorDisponibilidad, setErrorDisponibilidad] = useState("");
  const [selectedSlot, setSelectedSlot] = useState("");

  const [nombreCliente, setNombreCliente] = useState("");
  const [telefonoCliente, setTelefonoCliente] = useState("");
  const [emailCliente, setEmailCliente] = useState("");
  const [notas, setNotas] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", text: "" });

  useEffect(() => {
    let cancelled = false;

    const loadPeluquerias = async () => {
      setLoadingPeluquerias(true);
      setErrorPeluquerias("");
      try {
        const data = await fetchPeluqueriasActivas();
        if (cancelled) return;
        const list = Array.isArray(data) ? data : [];
        setPeluquerias(list);
        if (list.length > 0) {
          setSelectedPeluqueriaId(String(list[0].id));
        }
      } catch (error) {
        if (cancelled) return;
        setErrorPeluquerias(error.message || "No se pudieron cargar las peluquerias.");
      } finally {
        if (!cancelled) {
          setLoadingPeluquerias(false);
        }
      }
    };

    loadPeluquerias();
    return () => {
      cancelled = true;
    };
  }, []);

  const recargarDisponibilidad = useCallback(async () => {
    if (!selectedPeluqueriaId || !selectedFecha) {
      setSlots([]);
      return;
    }

    setLoadingDisponibilidad(true);
    setErrorDisponibilidad("");

    try {
      const data = await fetchDisponibilidad({
        idPeluqueria: selectedPeluqueriaId,
        fecha: selectedFecha,
        slotMinutes: SLOT_MINUTES,
      });

      const nextSlots = Array.isArray(data?.slots) ? data.slots : [];
      setSlots(nextSlots);
      setSelectedSlot((currentSlot) => {
        if (!currentSlot) return "";
        const stillAvailable = nextSlots.some(
          (slot) => slot.fechaHora === currentSlot && slot.disponible
        );
        return stillAvailable ? currentSlot : "";
      });
    } catch (error) {
      setErrorDisponibilidad(error.message || "No se pudo consultar la disponibilidad.");
      setSlots([]);
    } finally {
      setLoadingDisponibilidad(false);
    }
  }, [selectedFecha, selectedPeluqueriaId]);

  useEffect(() => {
    recargarDisponibilidad();
  }, [recargarDisponibilidad]);

  const slotsDisponibles = useMemo(() => slots.filter((slot) => slot.disponible), [slots]);

  const enviarReserva = async (event) => {
    event.preventDefault();
    setFeedback({ type: "", text: "" });

    if (!selectedSlot) {
      setFeedback({ type: "error", text: "Selecciona un horario disponible antes de confirmar." });
      return;
    }

    if (!nombreCliente.trim()) {
      setFeedback({ type: "error", text: "El nombre es obligatorio." });
      return;
    }

    setSubmitting(true);
    try {
      await crearReservaPublica({
        idPeluqueria: Number(selectedPeluqueriaId),
        fechaHora: selectedSlot,
        nombreCliente: nombreCliente.trim(),
        telefonoCliente: telefonoCliente.trim(),
        emailCliente: emailCliente.trim(),
        notas: notas.trim(),
      });

      setFeedback({
        type: "success",
        text: "Reserva creada correctamente. Te esperamos en el horario seleccionado.",
      });
      setSelectedSlot("");
      setTelefonoCliente("");
      setEmailCliente("");
      setNotas("");
      await recargarDisponibilidad();
    } catch (error) {
      if (error instanceof ApiError && error.status === 409) {
        setFeedback({ type: "error", text: "Ese horario ya fue tomado. Elige otro e intenta nuevamente." });
        await recargarDisponibilidad();
      } else {
        setFeedback({ type: "error", text: error.message || "No se pudo crear la reserva." });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="seccion fondo-claro" id="reservas-publicas">
      <div className="contenedor">
        <h2>Reserva publica de turnos</h2>
        <p className="intro">
          Elige peluqueria, fecha y horario disponible. Luego completa tus datos para confirmar tu
          reserva.
        </p>

        <div className="reserva-publica">
          <div className="reserva-panel">
            <h3>1) Elegi peluqueria y fecha</h3>
            {loadingPeluquerias ? (
              <p>Cargando peluquerias...</p>
            ) : errorPeluquerias ? (
              <p className="reserva-error">{errorPeluquerias}</p>
            ) : peluquerias.length === 0 ? (
              <p>No hay peluquerias activas en este momento.</p>
            ) : (
              <>
                <label htmlFor="peluqueria-select">Peluqueria</label>
                <select
                  id="peluqueria-select"
                  value={selectedPeluqueriaId}
                  onChange={(event) => setSelectedPeluqueriaId(event.target.value)}
                >
                  {peluquerias.map((peluqueria) => (
                    <option key={peluqueria.id} value={String(peluqueria.id)}>
                      {peluqueria.nombre}
                    </option>
                  ))}
                </select>

                <label htmlFor="fecha-reserva">Fecha</label>
                <input
                  id="fecha-reserva"
                  type="date"
                  value={selectedFecha}
                  min={getTodayIsoDate()}
                  onChange={(event) => setSelectedFecha(event.target.value)}
                />
              </>
            )}
          </div>

          <div className="reserva-panel">
            <h3>2) Selecciona horario</h3>
            {loadingDisponibilidad ? (
              <p>Cargando disponibilidad...</p>
            ) : errorDisponibilidad ? (
              <p className="reserva-error">{errorDisponibilidad}</p>
            ) : !selectedPeluqueriaId ? (
              <p>Selecciona una peluqueria para ver horarios.</p>
            ) : slots.length === 0 ? (
              <p>No hay horarios para la fecha elegida.</p>
            ) : (
              <div className="slots-grid" role="list" aria-label="Horarios disponibles">
                {slots.map((slot) => {
                  const taken = !slot.disponible || slot.conflicto;
                  const isActive = selectedSlot === slot.fechaHora;
                  return (
                    <button
                      key={slot.fechaHora}
                      type="button"
                      className={`slot-item ${taken ? "slot-ocupado" : "slot-libre"} ${
                        isActive ? "slot-activo" : ""
                      }`}
                      onClick={() => setSelectedSlot(slot.fechaHora)}
                      disabled={taken}
                    >
                      {formatSlotHour(slot.fechaHora)}
                      <small>{taken ? "Ocupado" : "Libre"}</small>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form className="reserva-panel reserva-formulario" onSubmit={enviarReserva}>
            <h3>3) Completa tus datos</h3>
            <label htmlFor="nombre-cliente">Nombre *</label>
            <input
              id="nombre-cliente"
              type="text"
              value={nombreCliente}
              onChange={(event) => setNombreCliente(event.target.value)}
              required
            />

            <label htmlFor="telefono-cliente">Telefono</label>
            <input
              id="telefono-cliente"
              type="tel"
              value={telefonoCliente}
              onChange={(event) => setTelefonoCliente(event.target.value)}
            />

            <label htmlFor="email-cliente">Email</label>
            <input
              id="email-cliente"
              type="email"
              value={emailCliente}
              onChange={(event) => setEmailCliente(event.target.value)}
            />

            <label htmlFor="notas-reserva">Notas</label>
            <textarea
              id="notas-reserva"
              rows="3"
              value={notas}
              onChange={(event) => setNotas(event.target.value)}
            />

            {selectedSlot && (
              <p className="reserva-slot-seleccionado">
                Horario elegido: <strong>{formatFriendlyDateTime(selectedSlot)}</strong>
              </p>
            )}

            {feedback.text && (
              <p className={feedback.type === "error" ? "reserva-error" : "reserva-success"}>
                {feedback.text}
              </p>
            )}

            <button
              type="submit"
              className="boton boton-primario"
              disabled={submitting || loadingDisponibilidad || slotsDisponibles.length === 0}
            >
              {submitting ? "Confirmando reserva..." : "Confirmar reserva"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}
