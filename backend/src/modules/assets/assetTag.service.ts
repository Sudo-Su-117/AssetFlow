import prisma from '../../db';

export class AssetTagService {
  static async generateNextTag(): Promise<string> {
    // Find the asset with the highest tag format "AF-XXXXXX"
    const lastAsset = await prisma.asset.findFirst({
      where: {
        assetTag: {
          startsWith: 'AF-'
        }
      },
      orderBy: {
        assetTag: 'desc'
      }
    });

    if (!lastAsset) {
      return 'AF-000001';
    }

    const lastTag = lastAsset.assetTag;
    const parts = lastTag.split('-');
    
    if (parts.length < 2) {
      return 'AF-000001';
    }

    const counterPart = parseInt(parts[1], 10);
    
    if (isNaN(counterPart)) {
      return 'AF-000001';
    }

    const nextCounter = counterPart + 1;
    const paddedCounter = nextCounter.toString().padStart(6, '0');
    
    return `AF-${paddedCounter}`;
  }
}
