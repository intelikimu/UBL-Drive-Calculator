"use client";

import Link from "next/link";
import { BsArrowRight } from "react-icons/bs";

export default function blogs(){
    // This is a simple component that renders a blogs page.
    // You can add more functionality or styles as needed.
    const blogs = [
        { id: 1, slug: "blogs1", title: "Blog 1", content: "This is the content of blog 1." },
        { id: 2, slug: "blogs2", title: "Blog 2", content: "This is the content of blog 2." },
        { id: 3, slug: "blogs3", title: "Blog 3", content: "This is the content of blog 3." },
    ];


    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-8">
        <h1 className="text-3xl font-bold">Blogs</h1>
        <p className="mt-2">Welcome to the blogs page!</p>
        <div className="mt-8 space-y-4">
           { blogs.map(blog => (
                <div key={blog.id} className="w-full p-4 border rounded-lg shadow-sm">
                    <h2 className="text-xl font-semibold">{blog.title}</h2>
                    <p className="mt-2">{blog.content}</p>
                    <Link href={`/blogs/${blog.slug}`}><BsArrowRight  className="text-blue-500 hover:underline mt-2 inline-block" /></Link >
                </div>
            ))}
            </div>
        </div>
    );
}