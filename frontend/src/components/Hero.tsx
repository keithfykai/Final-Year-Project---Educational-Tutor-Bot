import Image from "next/image";
import { useRouter } from "next/navigation";

export default function Hero() {
  const router = useRouter();

  return (
    <section className="flex flex-col bg-black items-center justify-center text-center py-20">
      <div className="w-full max-w-4xl px-4">
        <div className="flex flex-row items-center justify-center">
          <Image
            src="/Eduble Logo Light.svg"
            alt="Hero Image"
            width={200}
            height={20}
            className=""
          />
          <h1 className="mx-6 text-5xl font-bold text-black dark:text-white">Eduble</h1>
        </div>

        <h1 className="text-3xl font-bold my-6 text-slate-800 text-black dark:text-white">
          ⚡ Supercharge your learning with AI!
        </h1>
        
        <p className="text-lg text-slate-600 dark:text-slate-400 my-6">
          Eduble is a powerful AI Educational Assistant with the aim of 
          helping students succeed by providing instant, intelligent help tailored to 
          your level. Currently supports PSLE to A Level curriculum.
        </p>

        <div className="flex justify-center my-6 py-6">
          <button
            onClick={() => router.push('/chat')}
            className="px-6 py-3 mb-5 dark:bg-slate-600 dark:hover:bg-slate-500 bg-sky-500 text-white rounded-4xl hover:bg-sky-700 focus:outline-none focus:ring focus:ring-sky-500"
          >
            Start Chatting →
          </button>
        </div>
      </div>
    </section>
  );
}
