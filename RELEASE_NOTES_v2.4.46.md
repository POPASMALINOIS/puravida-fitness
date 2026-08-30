# Rage Training v2.4.46 — versión estable

**Estado:** versión estable validada  
**Rama congelada:** `release-v2.4.46-stable`  
**Commit base de la aplicación:** `a7ffc04bc122b1fd81800a94345bcc8eb95f7158`

Esta rama conserva el estado funcional de Rage Training validado antes de continuar con el desarrollo del módulo de rutinas.

## Funcionalidades incluidas

### Aplicación y navegación
- PWA instalable con logo e icono de Rage Training.
- Acceso directo sin login.
- Splash screen corporativa.
- Diseño adaptable a ordenador, móvil y, especialmente, tablet Android.
- Menú inferior a todo el ancho en dispositivos táctiles.

### Clientes
- Alta, consulta, edición y eliminación de clientes.
- Teléfono y correo completables posteriormente.
- Cambio o renovación de bono.
- Filtro de clientes: Todos, Activos e Inactivos.
- Asignación de entrenador habitual por cliente, modificable en cada reserva.

### Seguimiento deportivo
- Mesociclos dentro de la ficha de cada cliente.
- Mediciones y mediciones adicionales dentro de la ficha.
- Tabla opcional de ejercicios por mesociclo con filas ilimitadas.
- Edición posterior de ejercicio, peso, repeticiones y notas.
- Interfaz optimizada para teclado virtual de tablets Android.

### Agenda
- Calendario semanal con sesiones paralelas.
- Zoom vertical y opción Todo el día.
- Navegación entre semanas mediante gesto lateral.
- Citas arrastrables para cambiar día y hora.
- Control de solapamientos por entrenador.
- Cancelación normal y excepcional con su tratamiento correspondiente del bono.

### Pagos y facturación
- Registro, edición y eliminación controlada de pagos.
- Datos fiscales y registrales configurables.
- Facturas PDF de una página, sin marcas del navegador.
- Numeración correlativa y conservación de referencias anuladas.

## Limitaciones conocidas / siguiente fase

- Los datos continúan guardándose localmente en cada dispositivo; la sincronización centralizada con Supabase está pendiente.
- La sección Rutinas aún no está terminada. Se integrará dentro de la ficha de cada cliente, junto con Mesociclos y Mediciones.

## Recuperación

Si una modificación futura rompe la aplicación, esta rama permite recuperar exactamente esta versión estable sin depender del estado posterior de `main`.
