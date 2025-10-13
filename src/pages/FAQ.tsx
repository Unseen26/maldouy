import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const FAQ = () => {
  const faqs = [
    {
      question: "¿Qué es Maldo.uy?",
      answer: "Maldo.uy es una plataforma que conecta a personas con emprendimientos y profesionales que prestan servicios en Maldonado."
    },
    {
      question: "¿Cómo puedo contactar a un profesional?",
      answer: "Puedes registrarte en la plataforma y seleccionar al prestador de servicio que mejor se adapte a tus necesidades para comenzar a chatear, agendar el servicio y calificar al prestador una vez finalizada la tarea."
    },
    {
      question: "¿Cuánto cuesta usar la plataforma?",
      answer: "Registrarte y usar Maldo es gratis. El costo por los servicios depende del profesional que selecciones para la tarea. Maldo no establece los precios del prestador ni interviene en los servicios."
    },
    {
      question: "¿Quiénes pueden registrarse?",
      answer: "En Maldo pueden registrarse prestadores de servicios con oficio, profesionales, emprendedores y empresas que deseen construir una reputación verificable y ofrecer sus servicios en Maldonado a través de la aplicación. La reputación ganada por los trabajos realizados es abierta y propiedad del usuario gracias al uso de tecnología blockchain."
    },
    {
      question: "¿Cómo creo mi perfil en Maldo?",
      answer: "Crear tu perfil en Maldo es sencillo. Ingresá a Maldo.uy, registrate con WhatsApp, seguí los pasos para crear tu perfil y comenzá a construir tu reputación. Una vez que completes tu perfil, asegurate tener acceso al WhatsApp que usaste para registrarte, para que cuando te contacten, recibas una notificación."
    },
    {
      question: "¿Cómo me verifico en Maldo?",
      answer: "La verificación en Maldo se realiza a través de diferentes métodos que validan tu identidad y profesionalismo, aumentando la confianza de los usuarios en tu perfil."
    },
    {
      question: "¿Cómo funcionan los puntos de reputación?",
      answer: "Los puntos de reputación se acumulan a través de las calificaciones recibidas por los trabajos realizados y el nivel de verificación en Maldo. Cuantos más puntos de reputación tengas, más te recomendará la aplicación en las búsquedas."
    },
    {
      question: "¿Por qué Maldo se construye usando Blockchain?",
      answer: "Utilizamos blockchain para permitir que los usuarios sean dueños de su perfil y su reputación para siempre. Blockchain permite crear aplicaciones descentralizadas donde los usuarios tienen control sobre su información y reputación."
    },
    {
      question: "¿Cómo se gestionan los pagos en la plataforma?",
      answer: "Los pagos se gestionan directamente entre el cliente y el prestador de servicios. Maldo no interviene en las transacciones económicas entre las partes."
    },
    {
      question: "¿Qué sucede si tengo un problema con un servicio?",
      answer: "Si tienes algún inconveniente con un servicio, te recomendamos primero comunicarte directamente con el prestador. Maldo facilita la comunicación entre las partes a través de su sistema de mensajería."
    },
    {
      question: "¿Cómo puedo mejorar mi reputación en Maldo?",
      answer: "Para mejorar tu reputación, realizá servicios de alta calidad y solicitá calificaciones a quienes te agendan servicios. Conseguí todas las verificaciones posibles, y mantené tu perfil actualizado para aumentar tu visibilidad."
    },
    {
      question: "¿Puedo usar mi reputación en otras plataformas?",
      answer: "Sí, una de las ventajas de usar blockchain es que tu reputación es tuya, y puede ser presentada y verificada en otras plataformas."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold text-center mb-4 bg-gradient-hero bg-clip-text text-transparent">
            Preguntas Frecuentes
          </h1>
          
          <div className="mt-12">
            <Accordion type="single" collapsible className="space-y-4">
              {faqs.map((faq, index) => (
                <AccordionItem 
                  key={index} 
                  value={`item-${index}`}
                  className="border rounded-lg px-6 bg-card"
                >
                  <AccordionTrigger className="text-left font-medium hover:no-underline">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-12 p-6 bg-muted rounded-lg text-center">
            <p className="text-muted-foreground">
              Esperamos que estas respuestas a preguntas frecuentes te ayuden a entender mejor los beneficios y el funcionamiento de Maldo. Si tienes más dudas, no dudes en contactarnos!
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default FAQ;
