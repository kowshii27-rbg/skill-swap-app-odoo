#!/usr/bin/env python3
"""
Database initialization script for Skill Swap Platform
"""

from app.database import engine, SessionLocal
from app.models import Base, Skill
from sqlalchemy.orm import Session

def init_db():
    """Initialize the database with sample data"""
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    # Create a database session
    db = SessionLocal()
    
    try:
        # Check if skills already exist
        existing_skills = db.query(Skill).count()
        if existing_skills == 0:
            # Add sample skills
            sample_skills = [
                "Python Programming",
                "JavaScript",
                "React",
                "Node.js",
                "FastAPI",
                "SQL",
                "Machine Learning",
                "Data Analysis",
                "Web Design",
                "Graphic Design",
                "Photography",
                "Cooking",
                "Guitar",
                "Spanish",
                "French",
                "German",
                "Yoga",
                "Fitness Training",
                "Writing",
                "Public Speaking"
            ]
            
            for skill_name in sample_skills:
                skill = Skill(name=skill_name)
                db.add(skill)
            
            db.commit()
            print(f"✅ Added {len(sample_skills)} sample skills to the database")
        else:
            print(f"✅ Database already has {existing_skills} skills")
            
    except Exception as e:
        print(f"❌ Error initializing database: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    print("🚀 Initializing Skill Swap Platform Database...")
    init_db()
    print("✅ Database initialization complete!") 