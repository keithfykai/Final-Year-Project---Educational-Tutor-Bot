import Image from "next/image";

export default function Hero() {
  return (
    <section className="flex flex-col items-center justify-center text-center px-6 py-5 bg-sky-50 dark:bg-slate-900">
      <div className="w-full max-w-4xl">
        <Image
          src="https://static1.straitstimes.com.sg/s3fs-public/articles/2022/01/05/yq-olvl-05012022.jpg?VersionId=zWpc6Ek6H.OABtR6ab9liu6jTgFzWel5"
          alt="Hero Image"
          width={900}
          height={500}
          className="mx-auto mb-8 rounded-xl shadow-lg"
        />
        <h1 className="text-4xl font-bold mb-4 text-slate-800 dark:text-white">
          Supercharge your learning with AI!
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-300">
          Our Educational Tutor Bot helps students succeed by providing instant,
          intelligent help based on your level and curriculum. We support a wide range of 
          subjects and examinations, from PSLE to A Levels.
        </p>
      </div>
    </section>
  );
}
