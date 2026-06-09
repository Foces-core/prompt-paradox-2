export default function NotFound() {
  return (
    <main className="bg-[#020502] min-h-screen px-4 py-10 text-[#a7f3d0]">
      <div className="mx-auto max-w-xl border border-[#14b8a6]/20 bg-black/40 p-6 font-mono">
        <p className="text-[10px] font-bold tracking-widest text-[#14b8a6]/60 uppercase">
          OVERMIND
        </p>
        <h1 className="mt-3 text-2xl font-black text-[#d1ffd6]">Page Not Found</h1>
        <p className="mt-3 text-sm text-[#a7f3d0]/80">
          The requested route is not available.
        </p>
      </div>
    </main>
  );
}
