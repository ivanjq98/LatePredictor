import Image from 'next/image';
import systemDiagram from './system_architecture_diagram.svg';

export default function FlowchartPage() {
  return (
    <main style={{ padding: '40px', maxWidth: '1200px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '40px', color: "var(--text-secondary)", fontSize: 24 }}>Project Diagrams</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '60px' }}>
        
        {/* System Diagram Section */}
        <section>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: "var(--text-muted)" }}>System Architecture</h2>
          <div style={{ 
            marginTop: '20px',
            padding: '20px',
            backgroundColor: "var(--text-subtle)",
            borderRadius: '8px',
            display: 'flex',
            justifyContent: 'center'
          }}>
            <Image 
              src={systemDiagram} 
              alt="System Architecture SVG" 
              width={800} // Set a preferred max width
              height={500} // Set a preferred max height
              style={{ height: 'auto', width: '100%', maxWidth: '800px' }}
            />
          </div>
          
        </section>

         {/* Flowchart Section
         <section>
          <h2 style={{ borderBottom: '2px solid #eee', paddingBottom: '10px', color: 'white' }}>Process Flowchart</h2>
          <div style={{ 
            position: 'relative', 
            width: '60%', 
            marginTop: '20px',
            marginLeft: 'auto',   // Centers horizontally
            marginRight: 'auto',  // Centers horizontally
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
          }}>
            <Image 
              src={flowDiagram} 
              alt="Flowchart Diagram" 
              layout="responsive"
              placeholder="blur" // Optional: adds a blur-up effect while loading
            />
          </div>
        </section> */}


      </div>
    </main>
  );
}