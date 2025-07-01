// app/blogs/[slug]/page.tsx
import React from 'react';

const blugs = [
    { id: 1, slug: "blogs1", title: "Blog 1", content: "This is the content of blog 1." },
    { id: 2, slug: "blogs2", title: "Blog 2", content: "This is the content of blog 2." },
    { id: 3, slug: "blogs3", title: "Blog 3", content: "This is the content of blog 3." },
];

export default function BlogPage({ params }: { params: { slug: string } }) {
    const blug = blugs.find((blug) => blug.slug === params.slug);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
            <h1 className="text-3xl font-bold">Blog Post</h1>
            {blug ? (
                <div className="mt-8 w-full max-w-2xl p-4 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold">{blug.title}</h2>
                    <p className="mt-2">{blug.content}</p>
                </div>
            ) : (
                <p className="mt-4 text-red-500">Blog post not found.</p>
            )}
        </div>
    );
}
