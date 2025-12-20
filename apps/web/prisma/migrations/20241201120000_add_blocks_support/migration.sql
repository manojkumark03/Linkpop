-- CreateBlockType enum
CREATE TYPE "BlockType" AS ENUM ('MARKDOWN', 'BUTTON', 'COPY_TEXT', 'EXPAND');

-- Update LinkType enum to include BLOCK
ALTER TYPE "LinkType" ADD VALUE 'BLOCK';

-- Create blocks table
CREATE TABLE "Block" (
    "id" TEXT NOT NULL,
    "linkId" TEXT NOT NULL,
    "type" "BlockType" NOT NULL,
    "order" INTEGER NOT NULL,
    "content" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Block_pkey" PRIMARY KEY ("id")
);

-- Add relationship between Link and Block
ALTER TABLE "Block" ADD CONSTRAINT "Block_linkId_fkey" 
    FOREIGN KEY ("linkId") REFERENCES "Link"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add index for efficient querying
CREATE INDEX "Block_linkId_order_idx" ON "Block"("linkId", "order");