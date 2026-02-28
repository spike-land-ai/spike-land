"use client";

import { useState } from "react";
import {
  AccessibilityPanel,
  Breadcrumbs,
  CodePreview,
  ComponentSample,
  PageHeader,
  RelatedComponents,
  UsageGuide,
} from "@/components/storybook";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Filter,
  Loader2,
  Mail,
  Search,
  Upload,
} from "lucide-react";

// ---------------------------------------------------------------------------
// Code snippets for CodePreview
// ---------------------------------------------------------------------------
const codeSnippets = {
  validation: `import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

{/* Default state */}
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="you@example.com" />
</div>

{/* Error state */}
<div className="space-y-2">
  <Label htmlFor="error-email" className="text-destructive">Email (Error)</Label>
  <Input
    id="error-email"
    variant="error"
    defaultValue="invalid-email"
    aria-invalid="true"
    aria-describedby="error-msg"
  />
  <p id="error-msg" role="alert" className="text-destructive text-sm">
    <AlertCircle className="h-3.5 w-3.5 inline" /> Please enter a valid email.
  </p>
</div>

{/* Success state */}
<Input variant="success" defaultValue="hello@spike.land" />`,
  contact: `<form onSubmit={handleSubmit} className="space-y-4">
  <div className="grid grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="first">First name</Label>
      <Input id="first" placeholder="Jane" required />
    </div>
    <div className="space-y-2">
      <Label htmlFor="last">Last name</Label>
      <Input id="last" placeholder="Doe" required />
    </div>
  </div>
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" required />
  </div>
  <div className="space-y-2">
    <Label htmlFor="message">Message</Label>
    <Textarea id="message" rows={4} required />
  </div>
  <Button type="submit" className="w-full">Send Message</Button>
</form>`,
  wizard: `const [step, setStep] = useState(0);
const steps = [
  { label: "Account", description: "Create your account" },
  { label: "Profile", description: "Tell us about yourself" },
  { label: "Confirm", description: "Review and submit" },
];

{/* Step indicator */}
<div className="flex items-center gap-2">
  {steps.map((s, i) => (
    <button
      onClick={() => setStep(i)}
      className={i === step ? "bg-primary text-primary-foreground" : "bg-white/10"}
      aria-current={i === step ? "step" : undefined}
    >
      {i < step ? <CheckCircle2 /> : i + 1}
    </button>
  ))}
</div>

{/* Step content with conditional rendering */}
{step === 0 && <AccountFields />}
{step === 1 && <ProfileFields />}
{step === 2 && <ReviewSummary />}

{/* Navigation */}
<Button onClick={() => setStep(step - 1)} disabled={step === 0}>Back</Button>
<Button onClick={() => setStep(step + 1)}>
  {step === steps.length - 1 ? "Create Account" : "Continue"}
</Button>`,
  search: `<div className="flex gap-3">
  <div className="relative flex-1">
    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" />
    <Input placeholder="Search apps..." className="pl-10" aria-label="Search" />
  </div>
  <Button variant="outline" size="icon" aria-label="Filters">
    <Filter className="h-4 w-4" />
  </Button>
</div>

<div className="flex flex-wrap gap-3">
  <Select defaultValue="all">
    <SelectTrigger className="w-[140px]">
      <SelectValue placeholder="Category" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="all">All Categories</SelectItem>
      <SelectItem value="tools">Tools</SelectItem>
    </SelectContent>
  </Select>
</div>`,
  upload: `<div
  className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center"
  role="button"
  tabIndex={0}
  aria-label="Click or drag to upload files"
>
  <Upload className="h-8 w-8 mx-auto" />
  <p>Drop files here or click to browse</p>
  <p className="text-xs text-muted-foreground">PNG, JPG, PDF up to 10MB</p>
</div>`,
  inline: `<form className="flex gap-2" onSubmit={handleSubmit}>
  <Input
    type="email"
    placeholder="you@example.com"
    className="flex-1"
    required
    aria-label="Email address"
  />
  <Button type="submit">Join</Button>
</form>`,
  settings: `<div className="flex items-center justify-between">
  <div className="space-y-0.5">
    <Label htmlFor="dark-mode">Dark mode</Label>
    <p className="text-sm text-muted-foreground">Use dark theme.</p>
  </div>
  <Switch id="dark-mode" defaultChecked />
</div>

<Select defaultValue="en">
  <SelectTrigger>
    <SelectValue placeholder="Select language" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="en">English</SelectItem>
    <SelectItem value="es">Spanish</SelectItem>
  </SelectContent>
</Select>`,
};

// ---------------------------------------------------------------------------
// 1. Single-field form with validation states
// ---------------------------------------------------------------------------
function SingleFieldDemo() {
  return (
    <div className="w-full max-w-md space-y-6">
      <div className="space-y-2">
        <Label htmlFor="default-email">Email (Default)</Label>
        <Input
          id="default-email"
          type="email"
          placeholder="you@example.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="error-email" className="text-destructive">
          Email (Error)
        </Label>
        <Input
          id="error-email"
          type="email"
          variant="error"
          placeholder="you@example.com"
          defaultValue="invalid-email"
          aria-invalid="true"
          aria-describedby="error-email-msg"
        />
        <p
          id="error-email-msg"
          className="text-[0.8rem] font-medium text-destructive flex items-center gap-1.5"
          role="alert"
        >
          <AlertCircle className="h-3.5 w-3.5" />
          Please enter a valid email address.
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="success-email" className="text-success">
          Email (Success)
        </Label>
        <Input
          id="success-email"
          type="email"
          variant="success"
          defaultValue="hello@spike.land"
          aria-describedby="success-email-msg"
        />
        <p
          id="success-email-msg"
          className="text-[0.8rem] font-medium text-success flex items-center gap-1.5"
        >
          <CheckCircle2 className="h-3.5 w-3.5" />
          Looks good!
        </p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="loading-email" className="text-muted-foreground">
          Email (Loading)
        </Label>
        <div className="relative">
          <Input
            id="loading-email"
            type="email"
            defaultValue="checking@spike.land"
            disabled
            className="pr-10"
          />
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        </div>
        <p className="text-[0.8rem] text-muted-foreground">
          Verifying availability...
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// 2. Multi-field contact form
// ---------------------------------------------------------------------------
function ContactFormDemo() {
  const [submitted, setSubmitted] = useState(false);

  return (
    <Card className="w-full max-w-lg glass-1">
      <CardHeader>
        <CardTitle className="text-lg">Contact Us</CardTitle>
      </CardHeader>
      <CardContent>
        {submitted
          ? (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 className="h-10 w-10 text-success mx-auto" />
              <p className="text-sm text-muted-foreground">
                Message sent! We will get back to you soon.
              </p>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSubmitted(false)}
              >
                Send another
              </Button>
            </div>
          )
          : (
            <form
              className="space-y-4"
              onSubmit={e => {
                e.preventDefault();
                setSubmitted(true);
              }}
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="contact-first">First name</Label>
                  <Input id="contact-first" placeholder="Jane" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="contact-last">Last name</Label>
                  <Input id="contact-last" placeholder="Doe" required />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  placeholder="jane@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contact-message">Message</Label>
                <Textarea
                  id="contact-message"
                  placeholder="How can we help?"
                  rows={4}
                  required
                />
              </div>
              <Button type="submit" className="w-full">
                Send Message
              </Button>
            </form>
          )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 3. Settings / preferences form
// ---------------------------------------------------------------------------
function SettingsFormDemo() {
  return (
    <Card className="w-full max-w-lg glass-1">
      <CardHeader>
        <CardTitle className="text-lg">Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="dark-mode">Dark mode</Label>
            <p className="text-[0.8rem] text-muted-foreground">
              Use dark theme across the platform.
            </p>
          </div>
          <Switch id="dark-mode" defaultChecked />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email-notif">Email notifications</Label>
            <p className="text-[0.8rem] text-muted-foreground">
              Receive updates about your projects.
            </p>
          </div>
          <Switch id="email-notif" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="language-select">Language</Label>
          <Select defaultValue="en">
            <SelectTrigger id="language-select">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="es">Spanish</SelectItem>
              <SelectItem value="fr">French</SelectItem>
              <SelectItem value="de">German</SelectItem>
              <SelectItem value="hu">Hungarian</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-3">
          <Label>Interests</Label>
          <div className="space-y-2">
            {[
              "AI & Machine Learning",
              "Web Development",
              "Music Production",
              "Game Design",
            ].map(
              interest => (
                <div key={interest} className="flex items-center gap-3">
                  <Checkbox id={`interest-${interest}`} />
                  <Label
                    htmlFor={`interest-${interest}`}
                    className="text-sm font-normal cursor-pointer"
                  >
                    {interest}
                  </Label>
                </div>
              ),
            )}
          </div>
        </div>

        <Button className="w-full">Save Preferences</Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 4. Search form with filters
// ---------------------------------------------------------------------------
function SearchFormDemo() {
  return (
    <Card className="w-full max-w-2xl glass-1">
      <CardContent className="pt-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search apps, tools, templates..."
              className="pl-10"
              aria-label="Search"
            />
          </div>
          <Button variant="outline" size="icon" aria-label="Open filters">
            <Filter className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap gap-3">
          <Select defaultValue="all">
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              <SelectItem value="tools">Tools</SelectItem>
              <SelectItem value="games">Games</SelectItem>
              <SelectItem value="music">Music</SelectItem>
            </SelectContent>
          </Select>

          <Select defaultValue="newest">
            <SelectTrigger className="w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest</SelectItem>
              <SelectItem value="popular">Popular</SelectItem>
              <SelectItem value="name">Name A-Z</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center gap-2 ml-auto">
            <Checkbox id="free-only" />
            <Label
              htmlFor="free-only"
              className="text-sm font-normal cursor-pointer"
            >
              Free only
            </Label>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {["React", "AI", "Music", "Chess"].map(tag => (
            <Badge key={tag} variant="secondary" className="cursor-pointer">
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 5. Multi-step form wizard
// ---------------------------------------------------------------------------
function MultiStepFormDemo() {
  const [step, setStep] = useState(0);
  const steps = [
    { label: "Account", description: "Create your account" },
    { label: "Profile", description: "Tell us about yourself" },
    { label: "Confirm", description: "Review and submit" },
  ];

  return (
    <Card className="w-full max-w-lg glass-1">
      <CardContent className="pt-6 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.label} className="flex items-center gap-2 flex-1">
              <button
                type="button"
                onClick={() => setStep(i)}
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
                  ${
                  i === step
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : i < step
                    ? "bg-success/20 text-success"
                    : "bg-white/10 text-muted-foreground"
                }
                `}
                aria-current={i === step ? "step" : undefined}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : (
                  i + 1
                )}
              </button>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-success/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-bold">{steps[step]?.label}</h3>
          <p className="text-sm text-muted-foreground">
            {steps[step]?.description}
          </p>
        </div>

        {/* Step content */}
        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-email">Email</Label>
              <Input
                id="wizard-email"
                type="email"
                placeholder="you@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wizard-password">Password</Label>
              <Input
                id="wizard-password"
                type="password"
                placeholder="At least 8 characters"
              />
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wizard-name">Display name</Label>
              <Input id="wizard-name" placeholder="Your name" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wizard-bio">Bio</Label>
              <Textarea
                id="wizard-bio"
                placeholder="Tell us about yourself"
                rows={3}
              />
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
            <p className="text-muted-foreground">
              Review your details before creating your account. You can go back to edit any step.
            </p>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Account details set</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-success" />
              <span>Profile information added</span>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button
            onClick={() => setStep(Math.min(steps.length - 1, step + 1))}
            disabled={step === steps.length - 1}
          >
            {step === steps.length - 1 ? "Create Account" : "Continue"}
            {step < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 6. Multi-step form wizard with validation
// ---------------------------------------------------------------------------
function ValidationWizardDemo() {
  const [step, setStep] = useState(0);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [name, setName] = useState("");
  const [nameError, setNameError] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [agreeError, setAgreeError] = useState("");
  const [completed, setCompleted] = useState(false);

  const validateStep0 = () => {
    let valid = true;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError("Please enter a valid email address.");
      valid = false;
    } else {
      setEmailError("");
    }
    if (!password || password.length < 8) {
      setPasswordError("Password must be at least 8 characters.");
      valid = false;
    } else {
      setPasswordError("");
    }
    return valid;
  };

  const validateStep1 = () => {
    if (!name.trim()) {
      setNameError("Display name is required.");
      return false;
    }
    setNameError("");
    return true;
  };

  const validateStep2 = () => {
    if (!agreed) {
      setAgreeError("You must agree to the terms to continue.");
      return false;
    }
    setAgreeError("");
    return true;
  };

  const handleNext = () => {
    if (step === 0 && validateStep0()) setStep(1);
    else if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setCompleted(true);
  };

  const steps = ["Account", "Profile", "Terms"];

  if (completed) {
    return (
      <Card className="w-full max-w-lg glass-1">
        <CardContent className="pt-6 text-center py-10 space-y-3">
          <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
          <p className="font-bold text-lg">Account Created</p>
          <p className="text-sm text-muted-foreground">
            Welcome, {name}! Your account ({email}) is ready.
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStep(0);
              setEmail("");
              setPassword("");
              setName("");
              setAgreed(false);
              setCompleted(false);
            }}
          >
            Start over
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg glass-1">
      <CardContent className="pt-6 space-y-6">
        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div
                className={`
                  flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold transition-all
                  ${
                  i === step
                    ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                    : i < step
                    ? "bg-success/20 text-success"
                    : "bg-white/10 text-muted-foreground"
                }
                `}
              >
                {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
              </div>
              {i < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 rounded-full transition-colors ${
                    i < step ? "bg-success/40" : "bg-white/10"
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        <div>
          <h3 className="font-bold">{steps[step]}</h3>
          <p className="text-sm text-muted-foreground">
            {step === 0 && "Enter your credentials"}
            {step === 1 && "Choose your display name"}
            {step === 2 && "Review and accept terms"}
          </p>
        </div>

        {step === 0 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vw-email">Email</Label>
              <Input
                id="vw-email"
                type="email"
                value={email}
                onChange={e => {
                  setEmail(e.target.value);
                  setEmailError("");
                }}
                variant={emailError ? "error" : undefined}
                placeholder="you@example.com"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? "vw-email-err" : undefined}
              />
              {emailError && (
                <p
                  id="vw-email-err"
                  className="text-[0.8rem] text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {emailError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="vw-password">Password</Label>
              <Input
                id="vw-password"
                type="password"
                value={password}
                onChange={e => {
                  setPassword(e.target.value);
                  setPasswordError("");
                }}
                variant={passwordError ? "error" : undefined}
                placeholder="At least 8 characters"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? "vw-pass-err" : undefined}
              />
              {passwordError && (
                <p
                  id="vw-pass-err"
                  className="text-[0.8rem] text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {passwordError}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vw-name">Display name</Label>
              <Input
                id="vw-name"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setNameError("");
                }}
                variant={nameError ? "error" : undefined}
                placeholder="Your name"
                aria-invalid={!!nameError}
                aria-describedby={nameError ? "vw-name-err" : undefined}
              />
              {nameError && (
                <p
                  id="vw-name-err"
                  className="text-[0.8rem] text-destructive flex items-center gap-1.5"
                  role="alert"
                >
                  <AlertCircle className="h-3.5 w-3.5" />
                  {nameError}
                </p>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-white/5 border border-white/10 space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Email: {email}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-success" />
                <span>Name: {name}</span>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Checkbox
                id="vw-agree"
                checked={agreed}
                onCheckedChange={checked => {
                  setAgreed(checked === true);
                  setAgreeError("");
                }}
              />
              <Label
                htmlFor="vw-agree"
                className="text-sm font-normal cursor-pointer"
              >
                I agree to the Terms of Service and Privacy Policy
              </Label>
            </div>
            {agreeError && (
              <p
                className="text-[0.8rem] text-destructive flex items-center gap-1.5"
                role="alert"
              >
                <AlertCircle className="h-3.5 w-3.5" />
                {agreeError}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-between">
          <Button
            variant="ghost"
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
          >
            Back
          </Button>
          <Button onClick={handleNext}>
            {step === 2 ? "Create Account" : "Continue"}
            {step < 2 && <ChevronRight className="h-4 w-4 ml-1" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 7. File upload form
// ---------------------------------------------------------------------------
function FileUploadDemo() {
  return (
    <Card className="w-full max-w-md glass-1">
      <CardContent className="pt-6 space-y-4">
        <Label>Upload files</Label>
        <div
          className="border-2 border-dashed border-white/10 rounded-2xl p-8 text-center space-y-3 hover:border-primary/30 transition-colors cursor-pointer"
          role="button"
          tabIndex={0}
          aria-label="Click or drag to upload files"
        >
          <Upload className="h-8 w-8 text-muted-foreground mx-auto" />
          <div>
            <p className="text-sm font-medium">
              Drop files here or click to browse
            </p>
            <p className="text-xs text-muted-foreground">
              PNG, JPG, PDF up to 10MB
            </p>
          </div>
        </div>

        {/* Simulated uploaded file */}
        <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/10">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Mail className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate">design-mockup.png</p>
            <p className="text-xs text-muted-foreground">2.4 MB</p>
          </div>
          <Badge variant="success" className="text-[10px]">
            Uploaded
          </Badge>
        </div>

        <Button className="w-full">Submit Files</Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// 8. Inline form (newsletter / waitlist)
// ---------------------------------------------------------------------------
function InlineFormDemo() {
  const [subscribed, setSubscribed] = useState(false);

  return (
    <div className="w-full max-w-xl space-y-6">
      {/* Waitlist variant */}
      <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/20 space-y-3">
        <h3 className="font-bold">Join the waitlist</h3>
        <p className="text-sm text-muted-foreground">
          Be the first to know when new features launch.
        </p>
        {subscribed
          ? (
            <p className="text-sm text-success flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4" />
              You are on the list!
            </p>
          )
          : (
            <form
              className="flex gap-2"
              onSubmit={e => {
                e.preventDefault();
                setSubscribed(true);
              }}
            >
              <Input
                type="email"
                placeholder="you@example.com"
                className="flex-1"
                required
                aria-label="Email address"
              />
              <Button type="submit">Join</Button>
            </form>
          )}
      </div>

      {/* Newsletter variant */}
      <div className="p-6 rounded-2xl glass-1 border border-white/10 space-y-3">
        <h3 className="font-bold">Newsletter</h3>
        <p className="text-sm text-muted-foreground">
          Weekly updates on platform news, tips, and community highlights.
        </p>
        <form
          className="flex gap-2"
          onSubmit={e => e.preventDefault()}
        >
          <Input
            type="email"
            placeholder="your@email.com"
            className="flex-1"
            required
            aria-label="Email for newsletter"
          />
          <Button type="submit" variant="secondary">
            Subscribe
          </Button>
        </form>
        <p className="text-[0.7rem] text-muted-foreground/60">
          No spam, unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function FormsPage() {
  return (
    <div className="space-y-16 pb-20">
      <Breadcrumbs />

      <PageHeader
        title="Forms"
        description="Forms collect user input for actions like signing up, submitting feedback, and configuring settings. They are the primary way users interact with the spike.land platform."
        usage="Use forms to gather structured input. Keep forms short, validate inline, and always provide clear labels and error messages."
      />

      <UsageGuide
        dos={[
          "Always associate labels with inputs using htmlFor/id pairs.",
          "Show validation errors inline, next to the relevant field.",
          "Use placeholder text as a hint, not a replacement for labels.",
          "Group related fields together (e.g., first/last name on one row).",
          "Disable the submit button while a form is being processed.",
          "Use the Input variant prop (error, success) for visual validation states.",
        ]}
        donts={[
          "Don't rely on color alone to indicate errors -- include text and icons.",
          "Don't clear form data on validation failure.",
          "Don't use generic 'Error' messages -- be specific about what went wrong.",
          "Don't place required field indicators (*) without a legend explaining them.",
          "Don't auto-focus fields in modals on mobile -- it triggers the keyboard unexpectedly.",
        ]}
      />

      <ComponentSample
        title="Validation States"
        description="Every input supports default, error, success, and loading states using the variant prop and accessible annotations."
        code={codeSnippets.validation}
      >
        <SingleFieldDemo />
      </ComponentSample>

      <ComponentSample
        title="Contact Form"
        description="A multi-field form with structured layout, required fields, and a success confirmation state."
        code={codeSnippets.contact}
      >
        <ContactFormDemo />
      </ComponentSample>

      <ComponentSample
        title="Settings & Preferences"
        description="Forms with mixed control types: switches for toggles, selects for choices, and checkboxes for multi-select."
        code={codeSnippets.settings}
      >
        <SettingsFormDemo />
      </ComponentSample>

      <ComponentSample
        title="Search with Filters"
        description="A search bar paired with dropdown filters, checkboxes, and tag badges for refined queries."
        code={codeSnippets.search}
      >
        <SearchFormDemo />
      </ComponentSample>

      <ComponentSample
        title="Multi-Step Wizard"
        description="A 3-step form wizard with a visual step indicator, navigation controls, and progressive disclosure."
        code={codeSnippets.wizard}
      >
        <MultiStepFormDemo />
      </ComponentSample>

      <ComponentSample
        title="Multi-Step Wizard with Validation"
        description="An interactive 3-step wizard with per-step inline validation, error messages, and a completion state. Try clicking Continue without filling the fields to see validation in action."
      >
        <ValidationWizardDemo />
      </ComponentSample>

      <ComponentSample
        title="File Upload"
        description="A drag-and-drop upload zone with file preview, status badges, and a submit action."
        code={codeSnippets.upload}
      >
        <FileUploadDemo />
      </ComponentSample>

      <ComponentSample
        title="Inline Forms"
        description="Compact single-field forms for newsletter signups, waitlists, and quick actions embedded in content."
        code={codeSnippets.inline}
      >
        <InlineFormDemo />
      </ComponentSample>

      {/* Code Preview */}
      <CodePreview
        code={codeSnippets.validation}
        title="Form Code Examples"
        tabs={[
          { label: "Validation", code: codeSnippets.validation },
          { label: "Contact", code: codeSnippets.contact },
          { label: "Settings", code: codeSnippets.settings },
          { label: "Search", code: codeSnippets.search },
          { label: "Wizard", code: codeSnippets.wizard },
          { label: "Upload", code: codeSnippets.upload },
          { label: "Inline", code: codeSnippets.inline },
        ]}
      />

      <AccessibilityPanel
        notes={[
          "All inputs are associated with labels via htmlFor/id -- screen readers announce the label when the input is focused.",
          "Error messages use role=\"alert\" so screen readers announce them immediately when they appear.",
          "Inputs in error state set aria-invalid=\"true\" and aria-describedby pointing to the error message.",
          "The multi-step wizard uses aria-current=\"step\" to indicate the active step.",
          "File upload zones include role=\"button\" and tabIndex for keyboard access.",
          "Inline forms use aria-label on inputs when a visible label is not present.",
          "Disabled inputs use disabled attribute (not just visual styling) so assistive technology communicates the state.",
          "Color is never the sole indicator of state -- icons and text always accompany color changes.",
          "Validation wizard clears errors as the user corrects input, providing immediate feedback.",
        ]}
      />

      <RelatedComponents currentId="forms" />
    </div>
  );
}
