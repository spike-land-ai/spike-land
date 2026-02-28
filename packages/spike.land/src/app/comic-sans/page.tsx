"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "@/components/ui/link";
import { Heart, Sparkles, Star, Zap } from "lucide-react";

export default function ComicSansPage() {
  return (
    <main
      className="min-h-screen bg-gradient-to-br from-pink-500 via-purple-500 to-indigo-600 p-8"
      style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
    >
      <div className="mx-auto max-w-4xl">
        {/* Hero Section */}
        <div className="mb-12 text-center">
          <div className="mb-4 flex items-center justify-center gap-2">
            <Sparkles className="h-8 w-8 animate-pulse text-yellow-300" />
            <Star className="h-10 w-10 animate-bounce text-yellow-400" />
            <Sparkles className="h-8 w-8 animate-pulse text-yellow-300" />
          </div>
          <h1 className="mb-4 text-5xl font-bold text-white drop-shadow-lg md:text-7xl">
            Welcome, Friend!
          </h1>
          <p className="text-2xl text-white/90">
            This page was made just for YOU
          </p>
          <p className="mt-2 text-lg text-white/80">
            (Yes, we heard you only have Comic Sans installed)
          </p>
        </div>

        {/* Fun Facts Card */}
        <Card className="mb-8 border-4 border-yellow-400 bg-white/95 shadow-2xl">
          <CardHeader>
            <CardTitle
              className="flex items-center gap-2 text-3xl text-purple-600"
              style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
            >
              <Heart className="h-8 w-8 text-pink-500" />
              Did You Know?
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-lg text-gray-700">
            <p>
              <span className="font-bold text-purple-600">Comic Sans</span>{" "}
              was designed by Vincent Connare in 1994 for Microsoft Bob!
            </p>
            <p>
              It was inspired by comic book lettering and was meant to be friendly and approachable.
            </p>
            <p>
              Despite the hate it gets, Comic Sans is actually{" "}
              <span className="font-bold text-green-600">
                easier to read for people with dyslexia
              </span>
              !
            </p>
          </CardContent>
        </Card>

        {/* Features Grid */}
        <div className="mb-8 grid gap-6 md:grid-cols-2">
          <Card className="border-4 border-cyan-400 bg-white/95 shadow-xl transition-transform hover:scale-105">
            <CardContent className="p-6">
              <Zap className="mb-4 h-12 w-12 text-yellow-500" />
              <h3
                className="mb-2 text-2xl font-bold text-cyan-600"
                style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
              >
                Super Fast!
              </h3>
              <p className="text-gray-600">
                Our site works great with any font - even Comic Sans!
              </p>
            </CardContent>
          </Card>

          <Card className="border-4 border-pink-400 bg-white/95 shadow-xl transition-transform hover:scale-105">
            <CardContent className="p-6">
              <Heart className="mb-4 h-12 w-12 text-pink-500" />
              <h3
                className="mb-2 text-2xl font-bold text-pink-600"
                style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
              >
                Made With Love
              </h3>
              <p className="text-gray-600">
                Because good friends deserve custom pages!
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Message Section */}
        <Card className="mb-8 border-4 border-green-400 bg-gradient-to-r from-green-100 to-blue-100 shadow-2xl">
          <CardContent className="p-8 text-center">
            <h2
              className="mb-4 text-3xl font-bold text-green-600"
              style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
            >
              A Message For You
            </h2>
            <p className="mb-4 text-xl text-gray-700">
              We appreciate your feedback! At Spike Land, we believe everyone deserves a great
              experience - no matter what fonts they have installed.
            </p>
            <p className="text-lg text-gray-600">
              Thanks for being part of our community!
            </p>
          </CardContent>
        </Card>

        {/* CTA Section */}
        <div className="text-center">
          <p className="mb-6 text-xl text-white">
            Ready to explore the rest of Spike Land?
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              asChild
              size="lg"
              className="border-4 border-yellow-400 bg-yellow-400 text-xl text-purple-900 shadow-lg hover:bg-yellow-300"
              style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
            >
              <Link href="/">Go to Homepage</Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-4 border-white bg-transparent text-xl text-white hover:bg-white/20"
              style={{ fontFamily: "\"Comic Sans MS\", \"Comic Sans\", cursive" }}
            >
              <Link href="/apps/pixel">Try Pixel App</Link>
            </Button>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-12 text-center text-white/70">
          <p className="text-sm">
            P.S. - We&apos;re just teasing! Comic Sans is a perfectly valid font choice.
          </p>
          <p className="mt-2 text-xs">
            Made with Comic Sans and a lot of <Heart className="inline h-4 w-4 text-pink-400" />
          </p>
        </div>
      </div>
    </main>
  );
}
