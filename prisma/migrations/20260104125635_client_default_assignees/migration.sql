-- CreateTable
CREATE TABLE "_ClientDefaultAssignees" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_ClientDefaultAssignees_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_ClientDefaultAssignees_B_index" ON "_ClientDefaultAssignees"("B");

-- AddForeignKey
ALTER TABLE "_ClientDefaultAssignees" ADD CONSTRAINT "_ClientDefaultAssignees_A_fkey" FOREIGN KEY ("A") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_ClientDefaultAssignees" ADD CONSTRAINT "_ClientDefaultAssignees_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
