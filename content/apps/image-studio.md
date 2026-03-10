---
slug: "image-studio"
name: "Image Studio"
description: "AI image generation and enhancement suite. Generate, edit, upscale, and manage images with professional quality."
emoji: "🖼️"
category: "Media & Creative"
tags:
  - "image"
  - "generation"
  - "ai"
  - "media"
  - "editing"
  - "upscale"
tagline: "Professional AI image generation and enhancement suite."
pricing: "freemium"
is_featured: true
is_new: true
status: "live"
sort_order: 6
tools:
  - "img_generate"
  - "img_edit"
  - "img_enhance"
  - "img_remove_bg"
  - "img_crop"
  - "img_resize"
  - "img_album"
  - "img_album_create"
  - "img_list"
graph:
  img_generate:
    inputs: {}
    outputs:
      image_id: "string"
    always_available: true
  img_edit:
    inputs:
      image_id: "from:img_generate.image_id"
    outputs:
      image_id: "string"
    always_available: false
  img_enhance:
    inputs:
      image_id: "from:img_generate.image_id"
    outputs:
      job_id: "string"
    always_available: false
  img_remove_bg:
    inputs:
      image_id: "from:img_generate.image_id"
    outputs:
      image_id: "string"
    always_available: false
  img_album_create:
    inputs: {}
    outputs:
      album_id: "string"
    always_available: true
---

# Image Studio

Image Studio provides a complete, professional-grade pipeline for AI image generation, enhancement, editing, and curation. By integrating natively into the platform, these tools allow agents and users to fluidly go from concept to finished asset.

## 1. Generate Images

Create high-quality images from text descriptions. You can specify aspect ratios, styles, and prompt details to get the exact output you want.

<ToolRun name="img_generate" />

## 2. Edit and Transform

Modify your existing images using advanced AI tools. Perform targeted inpainting, change styles, or remove unwanted elements seamlessly.

<ToolRun name="img_edit" />

## 3. Enhance and Upscale

Take lower-resolution or imperfect images and significantly increase their quality. Enhance details, reduce noise, and upscale to higher resolutions suitable for print or professional use.

<ToolRun name="img_enhance" />

## 4. Background Removal

Instantly extract the subject of an image and remove the background with high precision.

<ToolRun name="img_remove_bg" />

## 5. Crop and Resize

Standardize and adapt your assets for different platforms and use cases without losing essential content.

<ToolRun name="img_crop" />
<ToolRun name="img_resize" />

## 6. Organize with Albums

Create albums, curate collections, and manage your image assets systematically.

<ToolRun name="img_album_create" />
<ToolRun name="img_album" />
<ToolRun name="img_list" />
