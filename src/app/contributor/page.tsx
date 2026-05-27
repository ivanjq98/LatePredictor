"use client";

import Image from "next/image";

const cleanImageUrl = (src: string | undefined | null): string => {
  if (!src || src.trim() === "") {
    return "/placeholder-avatar.png";
  }

  let cleaned = src.trim();

  const urlMatch = cleaned.match(/url\(['"]?(.*?)['"]?\)/i);
  if (urlMatch && urlMatch[1]) {
    cleaned = urlMatch[1];
  }

  cleaned = cleaned.replace(/^\/+(https?:\/\/)/i, "$1");

  if (cleaned.startsWith("http://") || cleaned.startsWith("https://")) {
    return cleaned;
  }

  return "/placeholder-avatar.png";
};

const contributors = [
  {
    id: 1,
    name: "Ivan Tan Kah Keng",
    role: "DevOps & Frontend Engineer",
    image: `url('/https://bfcnfizoqiyfpxzfvxya.supabase.co/storage/v1/object/public/latepredictor/img/ivan.png)`,
    style: {
      objectFit: "cover",
    } as const,
    bio: "Software engineering principles to infrastructure and operations problems, aiming to create highly reliable, scalable, and efficient software systems",
  },
  {
    id: 2,
    name: "Tey Ming Chuan",
    role: "Machine Learning & Backend Engineer",
    image: `url('/https://bfcnfizoqiyfpxzfvxya.supabase.co/storage/v1/object/public/latepredictor/img/mario.png)`,
    style: {
      objectFit: "cover",
    } as const,
    bio: "Research and builds, and deploys artificial intelligence systems to automate predictive models and solve business challenges",
  },
  {
    id: 3,
    name: "Eunice Han Wen Xin",
    role: "Data & Business Analyst",
    image: `url('/https://bfcnfizoqiyfpxzfvxya.supabase.co/storage/v1/object/public/latepredictor/img/eunice.png)`,
    style: {
      objectFit: "cover",
    } as const,
    bio: "Translate complex data into actionable business insights by designing, optimizing, and querying structured data.",
  },
];

export default function ContributorsPage() {
  return (
    <main
      style={{
        padding: "60px 20px",
        maxWidth: "1200px",
        margin: "0 auto",
        fontFamily: "Nunito",
      }}
    >
      <div style={{ textAlign: "center", marginBottom: "60px" }}>
        <h1
          style={{
            fontSize: "2.5rem",
            marginBottom: "10px",
            color: "var(--text-secondary)",
            letterSpacing: "0.12em",
          }}
        >
          Meet Our Contributors
        </h1>
        <p
          style={{
            color: "var(--text-muted)",
            fontSize: "1.1rem",
            maxWidth: "600px",
            margin: "0 auto",
            fontFamily: "Nunito",
            letterSpacing: "0.12em",
          }}
        >
          This project wouldn't be possible without the hard work of these
          amazing individuals
        </p>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "40px",
          justifyItems: "center",
        }}
      >
        {contributors.map((contributor, index) => (
          <div
            key={contributor.id}
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "40px 20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.08)",
              textAlign: "center",
              width: "100%",
              maxWidth: "320px",
            }}
          >
            <div
              style={{
                width: 120,
                height: 120,
                borderRadius: "50%",
                background:
                  "linear-gradient(135deg, var(--text-secondary), var(--text-primary))",
                margin: "0 auto 25px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow:
                  "0 0 0 4px rgba(249,115,22,0.2), 0 0 0 8px rgba(249,115,22,0.08)",
                position: "relative",
                zIndex: 1,
                overflow: "hidden",
              }}
            >
              <Image
                src={cleanImageUrl(contributor.image)}
                alt="Contributor Profile"
                fill
                sizes="120px"
                style={contributor.style}
                priority
              />
            </div>

            <h3
              style={{ fontSize: "1.3rem", margin: "0 0 8px 0", color: "#222" }}
            >
              {contributor.name}
            </h3>
            <p
              style={{
                color: "var(--text-secondary)",
                fontWeight: "bold",
                margin: "0 0 15px 0",
                fontSize: "0.95rem",
              }}
            >
              {contributor.role}
            </p>
            <p
              style={{
                color: "#666",
                fontSize: "0.95rem",
                lineHeight: "1.6",
                margin: 0,
              }}
            >
              {contributor.bio}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
