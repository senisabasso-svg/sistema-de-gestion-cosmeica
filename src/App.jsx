import { useState } from "react";

const modules = [
  {
    icon: "📅",
    title: "Turnos y agenda",
    text: "Planifica citas y segui el calendario del salon en un solo lugar.",
  },
  {
    icon: "💳",
    title: "Cobro / punto de venta",
    text: "Registra ventas con cliente asociado para una caja mas ordenada.",
  },
  {
    icon: "👤",
    title: "Clientes",
    text: "Guarda ficha de cliente, contacto y notas de atencion.",
  },
  {
    icon: "🏷",
    title: "Catalogo y tarifario",
    text: "Organiza servicios y precios del salon para cobrar con claridad.",
  },
  {
    icon: "📦",
    title: "Inventario y proveedores",
    text: "Controla productos del salon y su relacion con proveedores.",
  },
  {
    icon: "📈",
    title: "Informes",
    text: "Accede a informes y metricas de negocio para decidir mejor.",
  },
];

const steps = [
  {
    title: "Agendar",
    text: "Se registra el turno en agenda segun disponibilidad del salon.",
  },
  {
    title: "Atender",
    text: "El equipo consulta historial y notas del cliente antes de atender.",
  },
  {
    title: "Cobrar",
    text: "Se registra la venta en punto de venta asociada al cliente.",
  },
  {
    title: "Revisar informes",
    text: "La administracion analiza operacion e indicadores del salon.",
  },
];

const roles = [
  {
    title: "Dueno/a",
    text: "Vision general del salon, control de cobros e informacion para decidir.",
  },
  {
    title: "Recepcion",
    text: "Agenda ordenada, atencion mas rapida y menos idas y vueltas en caja.",
  },
  {
    title: "Equipo tecnico",
    text: "Turnos claros, historial del cliente y continuidad en cada servicio.",
  },
];

const faqs = [
  {
    q: "Los datos quedan en la nube?",
    a: "Si. La informacion se gestiona online para que puedas acceder desde distintos dispositivos con usuario y contrasena.",
  },
  {
    q: "Pueden usarlo varias personas al mismo tiempo?",
    a: "Si. Se pueden crear usuarios para distintos roles del salon, segun necesidad operativa.",
  },
  {
    q: "Ofrecen soporte durante la puesta en marcha?",
    a: "Si. Te acompanamos en la implementacion inicial y en consultas habituales de uso.",
  },
  {
    q: "Se puede migrar desde agenda en papel o WhatsApp?",
    a: "Si. Se puede iniciar de forma gradual y ordenar la informacion clave para el nuevo flujo.",
  },
  {
    q: "Como se maneja la privacidad de los datos?",
    a: "Se trabaja con accesos por usuario y buenas practicas de resguardo de informacion. Los textos legales deben adaptarse a tu realidad comercial.",
  },
];

const geminiContext = `
Sos el asistente comercial de Gestion Cosmetica.

Responde SOLAMENTE con informacion del sistema de gestion para peluquerias y barberias:
- Turnos y agenda
- Cobro / punto de venta con cliente asociado
- Clientes (ficha, contacto, notas)
- Catalogo y tarifario
- Inventario y proveedores
- Informes y metricas de negocio
- Operacion multi-salon por tenant (nombre/logo por local)
- Acceso seguro por usuario y rol de superadministracion

Tono: profesional, cercano, claro y sin jerga tecnica.
No inventes certificaciones, clientes reales, premios, ni precios exactos.
Si preguntan algo fuera de este sistema, aclara que solo podes responder sobre Gestion Cosmetica.
`;

export default function App() {
  const year = new Date().getFullYear();
  const [chatOpen, setChatOpen] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatError, setChatError] = useState("");
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Hola, soy el asistente de Gestion Cosmetica. Te respondo solo sobre el sistema.",
    },
  ]);

  const askGemini = async (event) => {
    event.preventDefault();
    const userText = chatInput.trim();
    if (!userText || chatLoading) return;

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
    if (!apiKey) {
      setChatError("Falta configurar VITE_GEMINI_API_KEY en el front.");
      return;
    }

    setChatError("");
    setChatLoading(true);
    setChatInput("");

    const nextMessages = [...messages, { role: "user", text: userText }];
    setMessages(nextMessages);

    const prompt = `${geminiContext}\n\nPregunta del usuario: ${userText}`;

    try {
      const response = await fetch(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-goog-api-key": apiKey,
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: prompt }],
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Gemini respondio con estado ${response.status}`);
      }

      const data = await response.json();
      const aiText =
        data?.candidates?.[0]?.content?.parts?.map((part) => part.text).join("\n").trim() ||
        "No pude generar respuesta en este momento.";

      setMessages((prev) => [...prev, { role: "assistant", text: aiText }]);
    } catch (error) {
      setChatError("No se pudo conectar con Gemini. Revisa la API key y la red.");
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text: "Ahora no pude responder. Si queres, intenta de nuevo en unos segundos.",
        },
      ]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <>
      <a className="skip-link" href="#contenido">
        Saltar al contenido principal
      </a>

      <header className="hero fondo-oscuro">
        <nav className="contenedor nav-principal" aria-label="Navegacion principal">
          <a href="#" className="marca" aria-label="Inicio">
            <img src="/assets/logo.png" alt="Logo de Gestion Cosmetica" className="marca-imagen" />
          </a>
          <a href="#contacto" className="boton boton-secundario">
            Contactar
          </a>
        </nav>

        <div className="contenedor hero-contenido" id="contenido">
          <p className="etiqueta">Gestion para peluquerias y barberias</p>
          <h1>Administra tu salon con agenda clara, caja ordenada y datos utiles</h1>
          <p className="subtitulo">
            Software para administrar el dia a dia del salon y las reservas, con datos claros y
            flujo de cobro ordenado.
          </p>
          <div className="hero-acciones">
            <a href="#" className="boton boton-primario">
              Solicitar demo
            </a>
            <a href="#" className="boton boton-secundario">
              Ver precios
            </a>
          </div>
          <p className="nota">Sin instalaciones complejas. Todo en la nube.</p>
        </div>
      </header>

      <section className="franja-confianza">
        <div className="contenedor lista-confianza" aria-label="Puntos clave">
          <p>Multi-salon</p>
          <p>Turnos + cobro</p>
          <p>Clientes e historial</p>
          <p>Informes y metricas</p>
        </div>
      </section>

      <main>
        <section className="seccion fondo-claro" id="modulos">
          <div className="contenedor">
            <h2>Como ayuda a tu salon</h2>
            <p className="intro">
              Menos papeles, menos errores en caja y mas trazabilidad por cliente con una
              operacion simple para todo el equipo.
            </p>

            <div className="grid-tarjetas">
              {modules.map((item) => (
                <article className="tarjeta" key={item.title}>
                  <div className="icono" aria-hidden="true">
                    {item.icon}
                  </div>
                  <h3>{item.title}</h3>
                  <p>{item.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="seccion fondo-suave" id="flujo">
          <div className="contenedor">
            <h2>Flujo tipico en el dia a dia</h2>
            <div className="pasos">
              {steps.map((step, index) => (
                <article className="paso" key={step.title}>
                  <span className="paso-numero">{index + 1}</span>
                  <h3>{step.title}</h3>
                  <p>{step.text}</p>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="seccion fondo-claro" id="roles">
          <div className="contenedor">
            <h2>Para quien es</h2>
            <div className="grid-roles">
              {roles.map((role) => (
                <article className="rol" key={role.title}>
                  <h3>{role.title}</h3>
                  <p>{role.text}</p>
                </article>
              ))}
            </div>

            <article className="destacado-seguridad" aria-label="Capacidades de operacion y acceso">
              <h3>Operacion por salon y acceso seguro</h3>
              <p>
                El sistema esta pensado para operar por salon (tenant), cada local con identidad
                propia (nombre y logo), con inicio de sesion por usuario y rol de superadministracion
                para una operacion centralizada.
              </p>
            </article>
          </div>
        </section>

        <section className="seccion fondo-suave" id="faq">
          <div className="contenedor">
            <h2>Preguntas frecuentes</h2>
            <div className="faq-lista">
              {faqs.map((faq) => (
                <details key={faq.q}>
                  <summary>{faq.q}</summary>
                  <p>{faq.a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="seccion cierre fondo-oscuro" id="contacto">
          <div className="contenedor cierre-contenido">
            <div>
              <h2>Ordena tu operacion y dale trazabilidad a cada cliente</h2>
              <p>Agenda, cobros e informes en una sola plataforma para tu salon.</p>
              <div className="hero-acciones">
                <a href="#" className="boton boton-primario">
                  Solicitar demo
                </a>
                <a href="#" className="boton boton-secundario">
                  Contactar
                </a>
              </div>
            </div>

            <form className="formulario" action="#" method="post" aria-label="Formulario de contacto">
              <h3>Hablemos de tu salon</h3>
              <p className="form-note">Formulario de ejemplo. Conectar backend despues.</p>
              {/* TODO: Reemplazar por endpoint real o mailto:ventas@tu-dominio.com */}
              {/* TODO: Reemplazar email de contacto real */}
              <label htmlFor="nombre">Nombre</label>
              <input id="nombre" name="nombre" type="text" autoComplete="name" required />

              <label htmlFor="email">Email</label>
              <input id="email" name="email" type="email" autoComplete="email" required />

              <label htmlFor="salon">Salon</label>
              <input id="salon" name="salon" type="text" autoComplete="organization" />

              <label htmlFor="mensaje">Mensaje</label>
              <textarea id="mensaje" name="mensaje" rows="4" />

              <button type="submit" className="boton boton-primario">
                Enviar consulta
              </button>
            </form>
          </div>
        </section>
      </main>

      <footer className="footer">
        <div className="contenedor footer-contenido">
          <p>&copy; {year} Gestion Cosmetica. Todos los derechos reservados.</p>
          <nav aria-label="Enlaces legales">
            <a href="#">Privacidad</a>
            <a href="#">Terminos</a>
            <a href="#">Instagram</a>
          </nav>
        </div>
      </footer>

      <div className="chatbox">
        <button
          type="button"
          className="chatbox-toggle"
          onClick={() => setChatOpen((prev) => !prev)}
          aria-expanded={chatOpen}
          aria-controls="chatbox-panel"
        >
          {chatOpen ? "Cerrar chat" : "Abrir chat"}
        </button>

        {chatOpen && (
          <section id="chatbox-panel" className="chatbox-panel" aria-label="Chat con asistente IA">
            <header className="chatbox-header">
              <h3>Asistente IA</h3>
              <p>Responde sobre Gestion Cosmetica</p>
            </header>

            <div className="chatbox-messages" role="log" aria-live="polite">
              {messages.map((message, index) => (
                <article key={`${message.role}-${index}`} className={`chat-msg chat-msg-${message.role}`}>
                  <strong>{message.role === "assistant" ? "Asistente" : "Vos"}:</strong>
                  <p>{message.text}</p>
                </article>
              ))}
            </div>

            <form className="chatbox-form" onSubmit={askGemini}>
              <label htmlFor="chat-input">Tu consulta</label>
              <textarea
                id="chat-input"
                value={chatInput}
                onChange={(event) => setChatInput(event.target.value)}
                rows="3"
                placeholder="Ej: Como me ayuda con turnos y cobros?"
                required
              />
              {chatError && <p className="chatbox-error">{chatError}</p>}
              <button type="submit" className="boton boton-primario" disabled={chatLoading}>
                {chatLoading ? "Enviando..." : "Enviar"}
              </button>
            </form>
          </section>
        )}
      </div>
    </>
  );
}
