import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Upload, FileText, FileSpreadsheet, FileImage, File, Download, FolderOpen } from "lucide-react";
import { Btn, Card, PageHeader, Table, Tabs, pageMeta } from "@/components/app/ui";
import { documents, fmtDate } from "@/lib/data";

export const Route = createFileRoute("/_shell/documents")({
  head: () => pageMeta("Documents", "Contracts, drawings, clearances, inspection reports and site media in one repository."),
  component: Documents,
});

const iconFor = (n: string) => (n.endsWith(".xlsx") ? FileSpreadsheet : n.endsWith(".zip") ? FileImage : n.endsWith(".pdf") ? FileText : File);
const cats = ["All", ...Array.from(new Set(documents.map((d) => d.category)))];

function Documents() {
  const [c, setC] = useState("All");
  return (
    <div>
      <PageHeader eyebrow="Repository" title="Document management" description="Version-controlled project records with role-based access." actions={<Btn><Upload className="h-4 w-4" /> Upload</Btn>} />
      <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {cats.slice(1, 5).map((k) => (
          <Card key={k} className="flex items-center gap-3 p-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-secondary text-primary"><FolderOpen className="h-5 w-5" /></span>
            <div><p className="text-sm font-semibold">{k}</p><p className="text-xs text-muted-foreground">{documents.filter((d) => d.category === k).length} files</p></div>
          </Card>
        ))}
      </div>
      <div className="mb-4"><Tabs items={cats} value={c} onChange={setC} /></div>
      <Card>
        <Table head={["Name", "Category", "Project", "Uploaded by", "Date", "Size", ""]}>
          {documents.filter((d) => c === "All" || d.category === c).map((d) => {
            const I = iconFor(d.name);
            return (
              <tr key={d.name}>
                <td><span className="flex items-center gap-2.5 font-medium"><I className="h-4 w-4 shrink-0 text-accent" />{d.name}</span></td>
                <td><span className="rounded-md bg-muted px-2 py-0.5 text-xs font-medium">{d.category}</span></td>
                <td className="text-muted-foreground">{d.project}</td>
                <td>{d.by}</td>
                <td className="whitespace-nowrap text-muted-foreground">{fmtDate(d.date)}</td>
                <td className="text-muted-foreground">{d.size}</td>
                <td><button aria-label={`Download ${d.name}`} className="rounded-md p-1.5 hover:bg-muted"><Download className="h-4 w-4" /></button></td>
              </tr>
            );
          })}
        </Table>
      </Card>
    </div>
  );
}
