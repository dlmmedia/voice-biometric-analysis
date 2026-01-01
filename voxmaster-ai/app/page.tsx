import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  IconWaveSine,
  IconFingerprint,
  IconMicrophone,
  IconFileAnalytics,
  IconArrowUpRight,
} from "@tabler/icons-react";
import Link from "next/link";

const features = [
  {
    title: "Vocal Analysis",
    description: "Analyze timbre, weight, and tone placement with DLM feature extraction",
    icon: IconWaveSine,
    href: "/analyze",
    badge: "Phase A",
    color: "bg-orange-500/10 text-orange-600",
  },
  {
    title: "Voice Biometrics",
    description: "Create voice signatures for identification and security verification",
    icon: IconFingerprint,
    href: "/biometrics",
    badge: "Phase B",
    color: "bg-blue-500/10 text-blue-600",
  },
  {
    title: "PersonaFlow Generator",
    description: "Generate voices with layered control: Identity, Voice Type, Inflections",
    icon: IconMicrophone,
    href: "/generate",
    badge: "Phase C",
    color: "bg-purple-500/10 text-purple-600",
  },
  {
    title: "Reports & Export",
    description: "Generate comprehensive PDF reports with visualizations and scores",
    icon: IconFileAnalytics,
    href: "/reports",
    badge: "Export",
    color: "bg-green-500/10 text-green-600",
  },
];

const stats = [
  { label: "Analyses Completed", value: "0", change: "+0%" },
  { label: "Voice Signatures", value: "0", change: "+0%" },
  { label: "Generated Outputs", value: "0", change: "+0%" },
  { label: "Reports Created", value: "0", change: "+0%" },
];

export default function HomePage() {
  return (
    <DashboardLayout
      title="Dashboard"
      description="Welcome to VoxMaster AI - Your unified vocal intelligence platform"
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {stats.map((stat) => (
            <Card key={stat.label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.label}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">{stat.change} from last month</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Features Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Platform Modules</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {features.map((feature) => (
              <Link key={feature.title} href={feature.href}>
                <Card className="group cursor-pointer transition-all hover:border-primary/50 hover:shadow-md">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className={`p-2 w-fit ${feature.color}`}>
                        <feature.icon className="size-5" />
                      </div>
                      <Badge variant="outline">{feature.badge}</Badge>
                    </div>
                    <CardTitle className="flex items-center gap-2 mt-4">
                      {feature.title}
                      <IconArrowUpRight className="size-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                    </CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            ))}
          </div>
        </div>

        {/* Quick Start Guide */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Start</CardTitle>
            <CardDescription>
              Get started with VoxMaster AI in three simple steps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                  1
                </div>
                <div>
                  <h4 className="font-medium">Upload Audio</h4>
                  <p className="text-sm text-muted-foreground">
                    Upload WAV or MP3 files for analysis
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                  2
                </div>
                <div>
                  <h4 className="font-medium">Analyze Voice</h4>
                  <p className="text-sm text-muted-foreground">
                    Get detailed timbre, weight, and placement scores
                  </p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center bg-primary text-primary-foreground text-sm font-medium">
                  3
                </div>
                <div>
                  <h4 className="font-medium">Export Report</h4>
                  <p className="text-sm text-muted-foreground">
                    Download comprehensive PDF reports
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
